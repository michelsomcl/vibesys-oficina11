import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Wrench, Plus, Search, Pencil, Trash2, Clock, DollarSign } from "lucide-react"
import { useServicos, useCreateServico, useDeleteServico } from "@/hooks/useServicos"
import { TablesInsert } from "@/integrations/supabase/types"
import { EditServicoDialog } from "@/components/EditServicoDialog"

const ServicoForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [servicoData, setServicoData] = useState<TablesInsert<"servicos">>({
    nome: "",
    valor_hora: 0,
  })

  const createServico = useCreateServico()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!servicoData.nome || !servicoData.valor_hora) {
      return
    }

    createServico.mutate(servicoData, {
      onSuccess: () => {
        setServicoData({
          nome: "",
          valor_hora: 0,
        })
        onSuccess?.()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="nome">Nome do Serviço</Label>
        <Input 
          id="nome" 
          placeholder="Nome do serviço" 
          value={servicoData.nome}
          onChange={(e) => setServicoData(prev => ({ ...prev, nome: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="valor_hora">Valor por Hora (R$)</Label>
        <Input 
          id="valor_hora" 
          type="number"
          step="0.01"
          placeholder="0,00" 
          value={servicoData.valor_hora || ""}
          onChange={(e) => setServicoData(prev => ({ ...prev, valor_hora: parseFloat(e.target.value) || 0 }))}
          required
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">Cancelar</Button>
        <Button 
          type="submit" 
          className="bg-primary hover:bg-primary/90"
          disabled={createServico.isPending}
        >
          {createServico.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  )
}

const Servicos = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingServico, setEditingServico] = useState<any>(null)

  const { data: servicos = [], isLoading } = useServicos()
  const deleteServico = useDeleteServico()

  const filteredServicos = servicos.filter(servico => 
    servico.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este serviço?")) {
      deleteServico.mutate(id)
    }
  }

  const handleFormSuccess = () => {
    setIsDialogOpen(false)
  }

  const handleEdit = (servico: any) => {
    setEditingServico(servico)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando serviços...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Serviços</h1>
          <p className="text-muted-foreground">Gerencie seus tipos de serviços</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Serviço</DialogTitle>
            </DialogHeader>
            <ServicoForm onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome do serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Serviços */}
      <div className="grid gap-6">
        {filteredServicos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "Nenhum serviço encontrado com os filtros aplicados." 
                  : "Nenhum serviço cadastrado ainda."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredServicos.map((servico) => (
            <Card key={servico.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{servico.nome}</CardTitle>
                      <Badge variant="outline">
                        <Wrench className="w-3 h-3 mr-1" />
                        Serviço
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-lg font-semibold text-green-600">
                      <DollarSign className="w-5 h-5" />
                      R$ {servico.valor_hora.toFixed(2).replace('.', ',')}
                      <Clock className="w-4 h-4 ml-2" />
                      <span className="text-sm text-muted-foreground">por hora</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(servico)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(servico.id)}
                      disabled={deleteServico.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {editingServico && (
        <EditServicoDialog
          servico={editingServico}
          open={!!editingServico}
          onOpenChange={(open) => !open && setEditingServico(null)}
        />
      )}
    </div>
  )
}

export default Servicos
