
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types"
import { toast } from "sonner"

type OrcamentoServico = Tables<"orcamento_servicos">
type OrcamentoServicoInsert = TablesInsert<"orcamento_servicos">
type OrcamentoServicoUpdate = TablesUpdate<"orcamento_servicos">

export const useOrcamentoServicos = (orcamentoId?: string) => {
  return useQuery({
    queryKey: ["orcamento_servicos", orcamentoId],
    queryFn: async (): Promise<(OrcamentoServico & { servico: Tables<"servicos"> })[]> => {
      if (!orcamentoId) return []
      
      const { data, error } = await supabase
        .from("orcamento_servicos")
        .select(`
          *,
          servico:servicos(*)
        `)
        .eq("orcamento_id", orcamentoId)

      if (error) throw error
      return data || []
    },
    enabled: !!orcamentoId,
  })
}

export const useCreateOrcamentoServico = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: OrcamentoServicoInsert) => {
      const { data: result, error } = await supabase
        .from("orcamento_servicos")
        .insert(data)
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orcamento_servicos", variables.orcamento_id] })
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] })
      toast.success("Serviço adicionado com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao adicionar serviço:", error)
      toast.error("Erro ao adicionar serviço")
    },
  })
}

export const useDeleteOrcamentoServico = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, orcamentoId }: { id: string, orcamentoId: string }) => {
      const { error } = await supabase
        .from("orcamento_servicos")
        .delete()
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orcamento_servicos", variables.orcamentoId] })
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] })
      toast.success("Serviço removido com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao remover serviço:", error)
      toast.error("Erro ao remover serviço")
    },
  })
}
