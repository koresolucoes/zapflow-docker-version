import pool from '../db.js';
import { Automation, Contact, Json, Profile } from '../types.js';
import { actionHandlers } from './handlers/index.js';
import { ActionResult } from './types.js';
import { ExecutionLifecycleHooks } from './ExecutionLifecycleHooks.js';

/**
 * Creates and configures a default set of lifecycle hooks for logging automation runs.
 * This decouples the logging mechanism from the execution engine itself.
 */
export const createDefaultLoggingHooks = (automationId: string, contactId: string | null, teamId: string): ExecutionLifecycleHooks => {
    const hooks = new ExecutionLifecycleHooks();
    let runId: string | null = null;

    hooks.addHandler('workflowExecuteBefore', async () => {
        const query = `
            INSERT INTO automation_runs (automation_id, contact_id, team_id, status)
            VALUES ($1, $2, $3, $4)
            RETURNING id;
        `;
        const values = [automationId, contactId, teamId, 'running'];

        try {
            const res = await pool.query(query, values);
            if (res.rows.length === 0) {
                throw new Error('Failed to retrieve automation run ID after creation.');
            }
            runId = res.rows[0].id;
        } catch (error) {
            console.error(`[Execution Logging] Failed to create automation_run record for automation ${automationId}`, error);
            throw new Error('Failed to start execution log.');
        }
    });

    hooks.addHandler('workflowExecuteAfter', async (status, details) => {
        if (!runId) return;
        const query = `
            UPDATE automation_runs
            SET status = $1, details = $2, updated_at = NOW()
            WHERE id = $3;
        `;
        const values = [status, details, runId];
        try {
            await pool.query(query, values);
        } catch (error) {
            console.error(`[Execution Logging] Failed to update automation_run record for run ${runId}`, error);
        }
    });

    hooks.addHandler('nodeExecuteBefore', async (_node) => {
        // This could be used for more granular, real-time logging if needed in the future.
    });

    hooks.addHandler('nodeExecuteAfter', async (node, status, details) => {
        if (!runId) return;
        const logQuery = `
            INSERT INTO automation_node_logs (run_id, node_id, team_id, status, details)
            VALUES ($1, $2, $3, $4, $5);
        `;
        const logValues = [runId, node.id, teamId, status, details];
        try {
            await pool.query(logQuery, logValues);
        } catch (error) {
            console.error(`[Execution Logging] Failed to create node log for node ${node.id} in run ${runId}`, error);
        }

        // TODO: Re-implement node stats increment logic.
        // The original implementation used a Supabase RPC ('increment_node_stat').
        // This needs to be replaced with a direct SQL query, likely an
        // INSERT ... ON CONFLICT DO UPDATE on an 'automation_node_stats' table.
        //
        // const { error: rpcError } = await supabaseAdmin.rpc('increment_node_stat', {
        //     p_automation_id: automationId,
        //     p_node_id: node.id,
        //     p_team_id: teamId,
        //     p_status: status,
        // });
        // if (rpcError) {
        //     console.error(`[Execution Logging] Failed to update node stats for node ${node.id} in run ${runId}`, rpcError);
        // }
    });

    return hooks;
};

/**
 * The core engine for executing an automation workflow.
 */
export const executeAutomation = async (
    automation: Automation,
    contact: Contact | null,
    startNodeId: string,
    trigger: Json | null,
    profile: Profile
): Promise<void> => {
    
    let currentContact = contact;
    const { id: automationId, team_id: teamId, nodes, edges } = automation;
    const hooks = createDefaultLoggingHooks(automationId, currentContact?.id || null, teamId);

    try {
        await hooks.runHook('workflowExecuteBefore');
        
        const nodesMap = new Map(nodes.map(node => [node.id, node]));
        const edgesMap = new Map();
        edges.forEach(edge => {
            const key = edge.sourceHandle ? `${edge.source}-${edge.sourceHandle}` : edge.source;
            edgesMap.set(key, edge.target);
        });
        
        let currentNode = nodesMap.get(startNodeId);
        
        while (currentNode) {
            let nextNodeId: string | undefined;
            let result: ActionResult = {};

            try {
                await hooks.runHook('nodeExecuteBefore', currentNode);
                const handler = actionHandlers[currentNode.data.type];
                if (!handler) {
                    throw new Error(`No handler found for node type: ${currentNode.data.type}`);
                }
                
                result = await handler({
                    profile,
                    contact: currentContact,
                    trigger,
                    node: currentNode,
                    automationId,
                    teamId,
                });

                await hooks.runHook('nodeExecuteAfter', currentNode, 'success', result.details || 'Executed successfully.');
                
                if (result.updatedContact) {
                    currentContact = result.updatedContact;
                }

                const edgeMapKey = result.nextNodeHandle ? `${currentNode.id}-${result.nextNodeHandle}` : currentNode.id;
                nextNodeId = edgesMap.get(edgeMapKey);

            } catch (nodeError: any) {
                await hooks.runHook('nodeExecuteAfter', currentNode, 'failed', nodeError.message);
                throw nodeError; // Stop the whole workflow on node error
            }

            currentNode = nextNodeId ? nodesMap.get(nextNodeId) : undefined;
        }

        await hooks.runHook('workflowExecuteAfter', 'success', 'Workflow completed.');

    } catch (workflowError: any) {
        console.error(`[Execution Engine] Workflow failed for automation ${automationId}:`, workflowError.message);
        await hooks.runHook('workflowExecuteAfter', 'failed', workflowError.message);
    }
};