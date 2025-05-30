
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { useServicos } from "@/hooks/useServicos"
import { useOrcamentoServicos, useCreateOrcamentoServico, useDeleteOrcamentoServico } from "@/hooks/useOrcamentoServicos"

interface OrcamentoServicosListProps {
  orcamentoId?: string
}

interface LocalServico {
  id: string
  servico_id: string
  servico_nome: string
  horas: number
  valor_hora: number
}

export const OrcamentoServicosList = ({ orcamentoId }: OrcamentoServicosListProps) => {
  const [selectedServicoId, setSelectedServicoId] = useState("")
  const [horas, setHoras] = useState("")
  const [valorHora, setValorHora] = useState("")
  const [localServicos, setLocalServicos] = useState<LocalServico[]>([])

  const { data: servicos = [] } = useServicos()
  const { data: orcamentoServicos = [] } = useOrcamentoServicos(orcamentoId)
  const createOrcamentoServico = useCreateOrcamentoServico()
  const deleteOrcamentoServico = useDeleteOrcamentoServico()

  // Se tem orcamentoId, usa dados do banco, senão usa dados locais
  const displayServicos = orcamentoId ? orcamentoServicos : localServicos

  const handleAddServico = () => {
    if (!selectedServicoId || !horas || !valorHora) {
      return
    }

    const servicoSelecionado = servicos.find(s => s.id === selectedServicoId)
    if (!servicoSelecionado) return

    if (orcamentoId) {
      // Se tem orcamentoId, salva no banco
      createOrcamentoServico.mutate({
        orcamento_id: orcamentoId,
        servico_id: selectedServicoId,
        horas: parseFloat(horas),
        valor_hora: parseFloat(valorHora),
      })
    } else {
      // Se não tem orcamentoId, adiciona na lista local
      const novoServico: LocalServico = {
        id: Date.now().toString(),
        servico_id: selectedServicoId,
        servico_nome: servicoSelecionado.nome,
        horas: parseFloat(horas),
        valor_hora: parseFloat(valorHora),
      }
      setLocalServicos(prev => [...prev, novoServico])
    }

    // Limpar campos
    setSelectedServicoId("")
    setHoras("")
    setValorHora("")
  }

  const handleRemoveServico = (id: string) => {
    if (orcamentoId) {
      // Remove do banco
      deleteOrcamentoServico.mutate({ id, orcamentoId })
    } else {
      // Remove da lista local
      setLocalServicos(prev => prev.filter(s => s.id !== id))
    }
  }

  const handleServicoChange = (servicoId: string) => {
    setSelectedServicoId(servicoId)
    const servico = servicos.find(s => s.id === servicoId)
    if (servico) {
      setValorHora(servico.valor_hora.toString())
    }
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Serviços</h3>
      
      {/* Lista de serviços existentes */}
      <div className="space-y-2 mb-4">
        {displayServicos.map((item) => {
          // Para dados do banco
          if ('servico' in item) {
            return (
              <div key={item.id} className="grid grid-cols-5 gap-2 items-center p-2 border rounded">
                <span className="text-sm">{item.servico?.nome}</span>
                <span className="text-sm text-center">{item.horas}</span>
                <span className="text-sm text-center">R$ {item.valor_hora.toString()}</span>
                <span className="text-sm text-center font-medium">
                  R$ {(parseFloat(item.horas.toString()) * parseFloat(item.valor_hora.toString())).toFixed(2)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveServico(item.id)}
                  className="w-8 h-8 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )
          } else {
            // Para dados locais
            const localItem = item as LocalServico
            return (
              <div key={localItem.id} className="grid grid-cols-5 gap-2 items-center p-2 border rounded">
                <span className="text-sm">{localItem.servico_nome}</span>
                <span className="text-sm text-center">{localItem.horas}</span>
                <span className="text-sm text-center">R$ {localItem.valor_hora.toString()}</span>
                <span className="text-sm text-center font-medium">
                  R$ {(localItem.horas * localItem.valor_hora).toFixed(2)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveServico(localItem.id)}
                  className="w-8 h-8 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )
          }
        })}
      </div>

      {/* Formulário para adicionar novo serviço */}
      <div className="grid grid-cols-5 gap-2 items-end">
        <div>
          <label className="text-sm font-medium">Serviço</label>
          <Select value={selectedServicoId} onValueChange={handleServicoChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {servicos.map((servico) => (
                <SelectItem key={servico.id} value={servico.id}>
                  {servico.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Horas</label>
          <Input
            type="number"
            step="0.1"
            placeholder="Horas"
            value={horas}
            onChange={(e) => setHoras(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Valor/Hora</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0,00"
            value={valorHora}
            onChange={(e) => setValorHora(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Total</label>
          <Input
            value={horas && valorHora ? 
              `R$ ${(parseFloat(horas) * parseFloat(valorHora)).toFixed(2)}` : 
              "R$ 0,00"
            }
            readOnly
            className="bg-gray-50"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleAddServico}
          disabled={!selectedServicoId || !horas || !valorHora || createOrcamentoServico.isPending}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
