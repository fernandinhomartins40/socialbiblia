import React, { useRef, useState } from 'react'
import { Upload, X, File, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/hooks/use-toast'
import { useUploadFile } from '@/hooks/usePlugbaseAPI'
import { StorageFile } from '@/lib/plugbase-api'

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number // em MB
  onSuccess?: (files: StorageFile[]) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
}

export function FileUpload({
  accept = "*/*",
  multiple = false,
  maxSize = 10, // 10MB default
  onSuccess,
  onError,
  disabled = false,
  className = "",
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<StorageFile[]>([])
  
  const uploadMutation = useUploadFile()

  const validateFile = (file: File): string | null => {
    // Verificar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      return `Arquivo muito grande. Tamanho máximo: ${maxSize}MB`
    }
    
    // Verificar tipo (básico)
    if (accept !== "*/*" && !accept.includes(file.type)) {
      return `Tipo de arquivo não suportado: ${file.type}`
    }
    
    return null
  }

  const handleFileUpload = async (files: FileList) => {
    const fileArray = Array.from(files)
    const uploadResults: StorageFile[] = []
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      const validation = validateFile(file)
      
      if (validation) {
        toast({
          title: 'Erro no arquivo',
          description: `${file.name}: ${validation}`,
          variant: 'destructive',
        })
        continue
      }

      try {
        setUploadProgress((i / fileArray.length) * 100)
        const result = await uploadMutation.mutateAsync(file)
        uploadResults.push(result)
      } catch (error: any) {
        const errorMsg = error.message || 'Erro ao enviar arquivo'
        toast({
          title: 'Erro no upload',
          description: `${file.name}: ${errorMsg}`,
          variant: 'destructive',
        })
        onError?.(errorMsg)
      }
    }
    
    setUploadProgress(null)
    
    if (uploadResults.length > 0) {
      setUploadedFiles(prev => [...prev, ...uploadResults])
      onSuccess?.(uploadResults)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      await handleFileUpload(files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await handleFileUpload(files)
    }
    // Limpar input para permitir re-upload do mesmo arquivo
    e.target.value = ''
  }

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) {
      return <Image className="w-4 h-4" />
    }
    return <File className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Área de Upload */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragOver ? 'border-primary bg-primary/5' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium">
          {isDragOver ? 'Solte os arquivos aqui' : 'Clique ou arraste arquivos'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {accept === "*/*" ? 'Qualquer tipo de arquivo' : `Tipos aceitos: ${accept}`}
          {' • '}
          Tamanho máximo: {maxSize}MB
          {multiple && ' • Múltiplos arquivos permitidos'}
        </p>
      </div>

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        disabled={disabled}
      />

      {/* Barra de Progresso */}
      {uploadProgress !== null && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Enviando arquivo(s)...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {/* Lista de Arquivos Enviados */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Arquivos enviados:</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.mimetype)}
                  <div>
                    <p className="text-sm font-medium">{file.originalName}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {file.mimetype}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(file.url, '_blank')}
                  >
                    Visualizar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUploadedFile(file.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}