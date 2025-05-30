
import { useState } from "react"
import { Loader2, Printer } from "lucide-react"
import { useOrcamentos, useDeleteOrcamento } from "@/hooks/useOrcamentos"
import { OrcamentoCard } from "@/components/OrcamentoCard"
import { OrcamentoFilters } from "@/components/OrcamentoFilters"
import { OrcamentoViewDialog } from "@/components/OrcamentoViewDialog"
import { OrcamentoEditDialog } from "@/components/OrcamentoEditDialog"
import { OrcamentoCreateDialog } from "@/components/OrcamentoCreateDialog"
import { Button } from "@/components/ui/button"

const Orcamentos = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewingOrcamento, setViewingOrcamento] = useState<any>(null)
  const [editingOrcamento, setEditingOrcamento] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: orcamentos = [], isLoading } = useOrcamentos()
  const deleteOrcamento = useDeleteOrcamento()

  const filteredOrcamentos = orcamentos.filter(orcamento => {
    const matchesSearch = orcamento.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         orcamento.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || orcamento.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleView = (orcamento: any) => {
    setViewingOrcamento(orcamento)
  }

  const handleEdit = (orcamento: any) => {
    setEditingOrcamento(orcamento)
  }

  const handleDelete = (id: string) => {
    deleteOrcamento.mutate(id)
  }

  const handleImprimir = (orcamento: any) => {
    // Gerar conteúdo HTML para impressão
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Orçamento ${orcamento.numero}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info { margin-bottom: 20px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; }
            .total { text-align: right; font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ORÇAMENTO</h1>
            <h2>${orcamento.numero}</h2>
          </div>
          
          <div class="info">
            <p><strong>Cliente:</strong> ${orcamento.cliente?.nome}</p>
            <p><strong>Data:</strong> ${new Date(orcamento.data_orcamento).toLocaleDateString('pt-BR')}</p>
            <p><strong>Validade:</strong> ${new Date(orcamento.validade).toLocaleDateString('pt-BR')}</p>
            <p><strong>Status:</strong> ${orcamento.status}</p>
          </div>

          ${orcamento.orcamento_pecas?.length > 0 ? `
            <h3>PEÇAS</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qtd</th>
                  <th>Valor Unit.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${orcamento.orcamento_pecas.map(item => `
                  <tr>
                    <td>${item.peca?.nome}</td>
                    <td>${item.quantidade}</td>
                    <td>R$ ${parseFloat(item.valor_unitario.toString()).toFixed(2).replace('.', ',')}</td>
                    <td>R$ ${(item.quantidade * parseFloat(item.valor_unitario.toString())).toFixed(2).replace('.', ',')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          ${orcamento.orcamento_servicos?.length > 0 ? `
            <h3>SERVIÇOS</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Serviço</th>
                  <th>Horas</th>
                  <th>Valor/Hora</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${orcamento.orcamento_servicos.map(item => `
                  <tr>
                    <td>${item.servico?.nome}</td>
                    <td>${item.horas}</td>
                    <td>R$ ${parseFloat(item.valor_hora.toString()).toFixed(2).replace('.', ',')}</td>
                    <td>R$ ${(parseFloat(item.horas.toString()) * parseFloat(item.valor_hora.toString())).toFixed(2).replace('.', ',')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          <div class="total">
            <p>VALOR TOTAL: R$ ${orcamento.valor_total.toFixed(2).replace('.', ',')}</p>
          </div>
        </body>
      </html>
    `

    // Abrir nova janela para impressão
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orçamentos</h1>
          <p className="text-muted-foreground">Gerencie orçamentos e aprovações</p>
        </div>
        
        <OrcamentoCreateDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
      </div>

      <OrcamentoFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Lista de Orçamentos */}
      <div className="grid gap-6">
        {filteredOrcamentos.map((orcamento) => (
          <OrcamentoCard 
            key={orcamento.id}
            orcamento={orcamento}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onImprimir={handleImprimir}
          />
        ))}
      </div>

      {filteredOrcamentos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum orçamento encontrado.</p>
        </div>
      )}

      <OrcamentoViewDialog 
        orcamento={viewingOrcamento}
        isOpen={!!viewingOrcamento}
        onClose={() => setViewingOrcamento(null)}
      />

      <OrcamentoEditDialog 
        orcamento={editingOrcamento}
        isOpen={!!editingOrcamento}
        onClose={() => setEditingOrcamento(null)}
      />
    </div>
  )
}

export default Orcamentos
