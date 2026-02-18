import { supabase } from "@/integrations/supabase/client";

export interface DnsServer {
  id: string;
  name: string;
  url: string;
}

export async function getDnsServers(): Promise<DnsServer[]> {
  const { data, error } = await supabase
    .from('dns_servers')
    .select('id, name, url')
    .order('name');
  if (error) throw error;
  return (data as DnsServer[]) ?? [];
}
