import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUpdateOrdemServico, OrdemServicoWithDetails } from "@/hooks/useOrdensServico"
import { Separator } from "@/components/ui/separator"
import { Printer } from "lucide-react"

interface OrdemServicoEditDialogProps {
  ordemServico: OrdemServicoWithDetails | null
  isOpen: boolean
  onClose: () => void
}

export const OrdemServicoEditDialog = ({ ordemServico, isOpen, onClose }: OrdemServicoEditDialogProps) => {
  const [statusServico, setStatusServico] = useState("")
  const [valorPago, setValorPago] = useState("")
  const [formaPagamento, setFormaPagamento] = useState("")
  
  const updateOrdemServico = useUpdateOrdemServico()

  useEffect(() => {
    if (ordemServico) {
      setStatusServico(ordemServico.status_servico)
      setValorPago(ordemServico.valor_pago.toString())
      setFormaPagamento(ordemServico.forma_pagamento || "")
    }
  }, [ordemServico])

  const handleSave = async () => {
    if (!ordemServico) return

    try {
      await updateOrdemServico.mutateAsync({
        id: ordemServico.id,
        status_servico: statusServico as any,
        valor_pago: parseFloat(valorPago) || 0,
        forma_pagamento: formaPagamento || null,
      })
      onClose()
    } catch (error) {
      console.error("Erro ao salvar:", error)
    }
  }

  const handlePrint = () => {
    if (!ordemServico) return
    
    const printContent = `
      <html>
        <head>
          <title>OS ${ordemServico.numero}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .label { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ORDEM DE SERVIÇO</h1>
            <h2>OS ${ordemServico.numero}</h2>
          </div>
          
          <div class="section">
            <h3>Dados do Cliente</h3>
            <div class="row"><span class="label">Nome:</span> ${ordemServico.cliente?.nome}</div>
            <div class="row"><span class="label">Documento:</span> ${ordemServico.cliente?.documento}</div>
            <div class="row"><span class="label">Telefone:</span> ${ordemServico.cliente?.telefone || 'N/A'}</div>
          </div>

          <div class="section">
            <h3>Dados do Veículo</h3>
            <div class="row"><span class="label">Veículo:</span> ${ordemServico.veiculo ? `${ordemServico.veiculo.marca} ${ordemServico.veiculo.modelo} ${ordemServico.veiculo.ano}` : 'N/A'}</div>
            <div class="row"><span class="label">Placa:</span> ${ordemServico.veiculo?.placa || 'N/A'}</div>
            <div class="row"><span class="label">Km Atual:</span> ${ordemServico.km_atual || 'N/A'}</div>
          </div>

          <div class="section">
            <h3>Serviços</h3>
            <table>
              <tr><th>Serviço</th><th>Horas</th><th>Valor/Hora</th><th>Total</th></tr>
              ${ordemServico.orcamento?.orcamento_servicos?.map(item => `
                <tr>
                  <td>${item.servico?.nome}</td>
                  <td>${item.horas}</td>
                  <td>R$ ${item.valor_hora.toFixed(2).replace('.', ',')}</td>
                  <td>R$ ${(parseFloat(item.horas.toString()) * parseFloat(item.valor_hora.toString())).toFixed(2).replace('.', ',')}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">Nenhum serviço</td></tr>'}
            </table>
          </div>

          <div class="section">
            <h3>Peças</h3>
            <table>
              <tr><th>Peça</th><th>Quantidade</th><th>Valor Unitário</th><th>Total</th></tr>
              ${ordemServico.orcamento?.orcamento_pecas?.map(item => `
                <tr>
                  <td>${item.peca?.nome}</td>
                  <td>${item.quantidade}</td>
                  <td>R$ ${item.valor_unitario.toFixed(2).replace('.', ',')}</td>
                  <td>R$ ${(item.quantidade * parseFloat(item.valor_unitario.toString())).toFixed(2).replace('.', ',')}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">Nenhuma peça</td></tr>'}
            </table>
          </div>

          <div class="section">
            <h3>Resumo Financeiro</h3>
            <div class="row"><span class="label">Valor Total:</span> R$ ${ordemServico.valor_total.toFixed(2).replace('.', ',')}</div>
            <div class="row"><span class="label">Valor Pago:</span> R$ ${ordemServico.valor_pago.toFixed(2).replace('.', ',')}</div>
            <div class="row"><span class="label">Valor a Pagar:</span> R$ ${ordemServico.valor_a_pagar?.toFixed(2).replace('.', ',') || '0,00'}</div>
            <div class="row"><span class="label">Forma de Pagamento:</span> ${ordemServico.forma_pagamento || 'N/A'}</div>
            <div class="row"><span class="label">Status:</span> ${ordemServico.status_servico}</div>
          </div>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (!ordemServico) return null

  const valorAPagar = ordemServico.valor_total - parseFloat(valorPago || "0")
  const statusPagamentoCalculado = valorAPagar <= 0 ? "Pago" : "Pendente"

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Editar OS {ordemServico.numero}</DialogTitle>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Cliente</h3>
              <p className="text-sm">{ordemServico.cliente?.nome}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Veículo</h3>
              <p className="text-sm">
                {ordemServico.veiculo 
                  ? `${ordemServico.veiculo.marca} ${ordemServico.veiculo.modelo} ${ordemServico.veiculo.ano} - ${ordemServico.veiculo.placa}`
                  : 'N/A'
                }
              </p>
            </div>
          </div>

          <Separator />

          {/* Status do Serviço */}
          <div>
            <Label htmlFor="status-servico">Status do Serviço</Label>
            <Select value={statusServico} onValueChange={setStatusServico}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Andamento">Andamento</SelectItem>
                <SelectItem value="Aguardando Peças">Aguardando Peças</SelectItem>
                <SelectItem value="Finalizado">Finalizado</SelectItem>
                <SelectItem value="Entregue">Entregue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Financeiro */}
          <div className="space-y-4">
            <h3 className="font-semibold">Financeiro</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Valor Total</Label>
                <Input 
                  value={`R$ ${ordemServico.valor_total.toFixed(2).replace('.', ',')}`}
                  disabled
                />
              </div>
              
              <div>
                <Label htmlFor="valor-pago">Valor Pago</Label>
                <Input
                  id="valor-pago"
                  type="number"
                  step="0.01"
                  value={valorPago}
                  onChange={(e) => setValorPago(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Valor a Pagar</Label>
                <Input 
                  value={`R$ ${valorAPagar.toFixed(2).replace('.', ',')}`}
                  disabled
                  className={valorAPagar <= 0 ? "text-green-600" : "text-red-600"}
                />
              </div>
              
              <div>
                <Label htmlFor="forma-pagamento">Forma de Pagamento</Label>
                <Input
                  id="forma-pagamento"
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  placeholder="Ex: PIX, Cartão, Dinheiro..."
                />
              </div>
            </div>

            <div>
              <Label>Status do Pagamento</Label>
              <Input 
                value={statusPagamentoCalculado}
                disabled
                className={statusPagamentoCalculado === "Pago" ? "text-green-600 font-medium" : "text-red-600 font-medium"}
              />
              <p className="text-xs text-muted-foreground mt-1">
                * Atualizado automaticamente baseado no valor pago
              </p>
            </div>
          </div>

          <Separator />

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateOrdemServico.isPending}>
              {updateOrdemServico.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
