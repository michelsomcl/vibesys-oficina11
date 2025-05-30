
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types"
import { toast } from "sonner"

type Orcamento = Tables<"orcamentos">
type OrcamentoInsert = TablesInsert<"orcamentos">
type OrcamentoUpdate = TablesUpdate<"orcamentos">

export interface OrcamentoWithDetails extends Orcamento {
  cliente?: Tables<"clientes">
  veiculo?: Tables<"veiculos">
  orcamento_pecas?: (Tables<"orcamento_pecas"> & {
    peca: Tables<"pecas">
  })[]
  orcamento_servicos?: (Tables<"orcamento_servicos"> & {
    servico: Tables<"servicos">
  })[]
}

export const useOrcamentos = () => {
  return useQuery({
    queryKey: ["orcamentos"],
    queryFn: async (): Promise<OrcamentoWithDetails[]> => {
      const { data: orcamentos, error } = await supabase
        .from("orcamentos")
        .select(`
          *,
          cliente:clientes(*),
          veiculo:veiculos(*),
          orcamento_pecas(
            *,
            peca:pecas(*)
          ),
          orcamento_servicos(
            *,
            servico:servicos(*)
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return orcamentos || []
    },
  })
}

export const useCreateOrcamento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orcamento: OrcamentoInsert) => {
      const { data: newOrcamento, error } = await supabase
        .from("orcamentos")
        .insert(orcamento)
        .select()
        .single()

      if (error) throw error
      return newOrcamento
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] })
      toast.success("Orçamento criado com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao criar orçamento:", error)
      toast.error("Erro ao criar orçamento")
    },
  })
}

export const useUpdateOrcamento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: OrcamentoUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("orcamentos")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] })
      toast.success("Orçamento atualizado com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao atualizar orçamento:", error)
      toast.error("Erro ao atualizar orçamento")
    },
  })
}

export const useDeleteOrcamento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("orcamentos")
        .delete()
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] })
      toast.success("Orçamento excluído com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao excluir orçamento:", error)
      toast.error("Erro ao excluir orçamento")
    },
  })
}
