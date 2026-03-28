export function AuthConfigNotice() {
  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <p className="font-medium">Auth indisponivel nesta preview</p>
      <p className="mt-1 leading-6">
        Este deploy esta sem as variaveis do Supabase configuradas. Login com e-mail e Google so volta a
        funcionar depois de configurar o projeto Vercel com as chaves do auth e liberar a URL do deploy no
        Supabase.
      </p>
    </div>
  )
}
