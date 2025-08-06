import { BaseRepository } from '../BaseRepository';
import { Database } from '../../database.types.js';
import { supabaseAdmin } from '../../supabaseAdmin.js';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * Repositório para operações relacionadas a usuários (perfis)
 */
export class UserRepository extends BaseRepository<'profiles'> {
  constructor() {
    super('profiles');
  }

  /**
   * Busca um usuário pelo email
   * @param email Email do usuário
   * @returns Perfil do usuário ou null se não encontrado
   */
  async findByEmail(email: string): Promise<Profile | null> {
    const { data, error } = await this.query
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error finding user by email:', error);
      return null;
    }

    return data;
  }

  /**
   * Busca usuários por time
   * @param teamId ID do time
   * @returns Lista de perfis de usuários do time
   */
  async findByTeam(teamId: string): Promise<Profile[]> {
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .select('profiles:profiles(*)')
      .eq('team_id', teamId);

    if (error || !data) {
      console.error('Error finding users by team:', error);
      return [];
    }

    return (data as unknown as Array<{ profiles: Profile }>).map(item => item.profiles);
  }

  /**
   * Atualiza o token de acesso do Meta (WhatsApp)
   * @param userId ID do usuário
   * @param accessToken Token de acesso
   * @returns Perfil atualizado ou null em caso de erro
   */
  async updateMetaAccessToken(userId: string, accessToken: string): Promise<Profile | null> {
    return this.update(userId, {
      meta_access_token: accessToken,
      updated_at: new Date().toISOString()
    } as ProfileUpdate);
  }
}

// Exportar instância única
export const userRepository = new UserRepository();
