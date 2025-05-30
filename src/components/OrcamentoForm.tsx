
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useClientes } from "@/hooks/useClientes"
import { useCreateOrcamento, useUpdateOrcamento } from "@/hooks/useOrcamentos"
import { useCreateOrcamentoPeca } from "@/hooks/useOrcamentoPecas"
import { useCreateOrcamentoServico } from "@/hooks/useOrcamentoServicos"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { OrcamentoPecasList } from "@/components/OrcamentoPecasList"
import { OrcamentoServicosList } from "@/components/OrcamentoServicosList"
import { differenceInDays, parseISO } from "date-fns"
import { toast } from "sonner"

const orcamentoSchema = z.object({
  cliente_id: z.string().min(1, "Cliente é obrigatório"),
  veiculo_info: z.string().optional(),
  km_atual: z.string().optional(),
  data_orcamento: z.string().min(1, "Data do orçamento é obrigatória"),
  validade: z.string().min(1, "Validade é obrigatória"),
})

type OrcamentoFormData = z.infer<typeof orcamentoSchema>

interface OrcamentoFormProps {
  orcamento?: any
  onSuccess?: () => void
  onCancel?: () => void
}

interface LocalPeca {
  id: string
  peca_id: string
  peca_nome: string
  quantidade: number
  valor_unitario: number
}

interface LocalServico {
  id: string
  servico_id: string
  servico_nome: string
  horas: number
  valor_hora: number
}

export const OrcamentoForm = ({ orcamento, onSuccess, onCancel }: OrcamentoFormProps) => {
  const [selectedClienteId, setSelectedClienteId] = useState(orcamento?.cliente_id || "")
  const [selectedCliente, setSelectedCliente] = useState<any>(null)
  const [localPecas, setLocalPecas] = useState<LocalPeca[]>([])
  const [localServicos, setLocalServicos] = useState<LocalServico[]>([])
  
  const { data: clientes = [] } = useClientes()
  
  const createOrcamento = useCreateOrcamento()
  const updateOrcamento = useUpdateOrcamento()
  const createOrcamentoPeca = useCreateOrcamentoPeca()
  const createOrcamentoServico = useCreateOrcamentoServico()

  const form = useForm<OrcamentoFormData>({
    resolver: zodResolver(orcamentoSchema),
    defaultValues: {
      cliente_id: orcamento?.cliente_id || "",
      veiculo_info: "",
      km_atual: orcamento?.km_atual || "",
      data_orcamento: orcamento?.data_orcamento || new Date().toISOString().split('T')[0],
      validade: orcamento?.validade || "",
    },
  })

  // Atualiza as informações do cliente selecionado
  useEffect(() => {
    if (selectedClienteId) {
      const cliente = clientes.find(c => c.id === selectedClienteId)
      setSelectedCliente(cliente)
      
      if (cliente && cliente.marca && cliente.modelo) {
        const veiculoInfo = `${cliente.marca} ${cliente.modelo} ${cliente.ano} - ${cliente.placa}`
        form.setValue("veiculo_info", veiculoInfo)
      } else {
        form.setValue("veiculo_info", "")
      }
    } else {
      setSelectedCliente(null)
      form.setValue("veiculo_info", "")
    }
  }, [selectedClienteId, clientes, form])

  // Carrega dados do orçamento existente
  useEffect(() => {
    if (orcamento) {
      console.log("Carregando orçamento:", orcamento)
      setSelectedClienteId(orcamento.cliente_id)
      
      // Define informações do veículo baseado no cliente
      if (orcamento.cliente) {
        const cliente = orcamento.cliente
        if (cliente.marca && cliente.modelo) {
          const veiculoInfo = `${cliente.marca} ${cliente.modelo} ${cliente.ano} - ${cliente.placa}`
          form.setValue("veiculo_info", veiculoInfo)
        }
      }
    }
  }, [orcamento, form])

  const salvarPecasEServicos = async (orcamentoId: string) => {
    console.log("Salvando peças e serviços para orçamento:", orcamentoId)
    console.log("Peças locais:", localPecas)
    console.log("Serviços locais:", localServicos)

    // Salvar peças
    for (const peca of localPecas) {
      try {
        await createOrcamentoPeca.mutateAsync({
          orcamento_id: orcamentoId,
          peca_id: peca.peca_id,
          quantidade: peca.quantidade,
          valor_unitario: peca.valor_unitario,
        })
      } catch (error) {
        console.error("Erro ao salvar peça:", error)
      }
    }

    // Salvar serviços
    for (const servico of localServicos) {
      try {
        await createOrcamentoServico.mutateAsync({
          orcamento_id: orcamentoId,
          servico_id: servico.servico_id,
          horas: servico.horas,
          valor_hora: servico.valor_hora,
        })
      } catch (error) {
        console.error("Erro ao salvar serviço:", error)
      }
    }
  }

  const onSubmit = async (data: OrcamentoFormData) => {
    try {
      console.log("Dados do formulário:", data)
      console.log("Cliente selecionado:", selectedCliente)
      
      if (orcamento) {
        await updateOrcamento.mutateAsync({
          id: orcamento.id,
          cliente_id: data.cliente_id,
          veiculo_id: null,
          km_atual: data.km_atual,
          data_orcamento: data.data_orcamento,
          validade: data.validade,
        })
      } else {
        // Criar novo orçamento
        const novoOrcamento = await createOrcamento.mutateAsync({
          cliente_id: data.cliente_id,
          veiculo_id: null,
          km_atual: data.km_atual,
          data_orcamento: data.data_orcamento,
          validade: data.validade,
          numero: "",
          valor_total: 0,
          status: "Pendente",
        })

        console.log("Orçamento criado:", novoOrcamento)

        // Salvar peças e serviços se houver
        if (localPecas.length > 0 || localServicos.length > 0) {
          await salvarPecasEServicos(novoOrcamento.id)
          toast.success("Orçamento criado com peças e serviços!")
        }
      }
      onSuccess?.()
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error)
    }
  }

  const handleClienteChange = (clienteId: string) => {
    setSelectedClienteId(clienteId)
    form.setValue("cliente_id", clienteId)
  }

  const hasVeiculoInfo = selectedCliente && selectedCliente.marca && selectedCliente.modelo

  // Calcular dias de validade
  const validadeDias = form.watch("validade") && form.watch("data_orcamento") 
    ? differenceInDays(parseISO(form.watch("validade")), parseISO(form.watch("data_orcamento")))
    : 0

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cliente_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <Select onValueChange={handleClienteChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="veiculo_info"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Veículo</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    value={
                      !selectedClienteId 
                        ? "Selecione um cliente primeiro"
                        : !hasVeiculoInfo
                        ? "Nenhum veículo cadastrado para este cliente"
                        : field.value
                    }
                    readOnly
                    className="bg-gray-50"
                    placeholder="Informações do veículo aparecerão aqui"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="km_atual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Km Atual</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Digite a quilometragem atual" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="data_orcamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data do Orçamento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="validade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Validade</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {validadeDias > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Validade:</strong> Este orçamento é válido por {validadeDias} dia(s)
            </p>
          </div>
        )}

        <Separator />

        <OrcamentoPecasList 
          orcamentoId={orcamento?.id} 
          localPecas={localPecas}
          setLocalPecas={setLocalPecas}
        />

        <Separator />

        <OrcamentoServicosList 
          orcamentoId={orcamento?.id}
          localServicos={localServicos}
          setLocalServicos={setLocalServicos}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            type="submit"
            disabled={createOrcamento.isPending || updateOrcamento.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {orcamento ? "Atualizar Orçamento" : "Salvar Orçamento"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
