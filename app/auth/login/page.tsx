'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, AlertCircle, Loader2 } from 'lucide-react'

type Mode = 'login' | 'signup' | 'reset'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/clients')
        router.refresh()
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
              `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        setSuccess('Un email de confirmation vous a été envoyé. Vérifiez votre boîte de réception.')
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
        })
        if (error) throw error
        setSuccess('Un email de réinitialisation vous a été envoyé.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue'
      if (msg.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect.')
      } else if (msg.includes('User already registered')) {
        setError('Un compte existe déjà avec cet email.')
      } else if (msg.includes('Password should be at least')) {
        setError('Le mot de passe doit contenir au moins 6 caractères.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const titles: Record<Mode, string> = {
    login: 'Connexion',
    signup: 'Créer un compte',
    reset: 'Mot de passe oublié',
  }

  const subtitles: Record<Mode, string> = {
    login: 'Accédez à votre espace de gestion',
    signup: 'Rejoignez votre équipe',
    reset: 'Recevez un lien de réinitialisation',
  }

  const submitLabels: Record<Mode, string> = {
    login: 'Se connecter',
    signup: 'Créer le compte',
    reset: 'Envoyer le lien',
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex w-1/2 bg-sidebar flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-sidebar-foreground" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground leading-tight">Mon Agence</p>
            <p className="text-xs text-sidebar-foreground/50">Communication</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-sidebar-foreground leading-snug text-balance">
              Gérez vos clients, devis et factures en un seul endroit.
            </h1>
            <p className="text-sidebar-foreground/50 text-sm leading-relaxed">
              Un outil simple et efficace conçu pour les agences de communication.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: 'Clients', desc: 'Centralisés' },
              { label: 'Devis', desc: 'Professionnels' },
              { label: 'Factures', desc: 'Suivies' },
            ].map((item) => (
              <div key={item.label} className="bg-sidebar-accent/40 rounded-lg p-4">
                <p className="text-sidebar-foreground font-semibold text-sm">{item.label}</p>
                <p className="text-sidebar-foreground/50 text-xs mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-sidebar-foreground/30">CRM Agence &copy; {new Date().getFullYear()}</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" strokeWidth={1.8} />
            </div>
            <span className="font-semibold text-foreground text-sm">Mon Agence CRM</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-foreground">{titles[mode]}</h2>
            <p className="text-sm text-muted-foreground">{subtitles[mode]}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@agence.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {mode !== 'reset' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => { setMode('reset'); setError(null); setSuccess(null) }}
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  disabled={loading}
                  minLength={6}
                />
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="py-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="py-3 border-green-200 bg-green-50 text-green-800">
                <AlertDescription className="text-sm">{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {submitLabels[mode]}
            </Button>
          </form>

          <div className="text-center space-y-2">
            {mode === 'login' ? (
              <p className="text-sm text-muted-foreground">
                Pas encore de compte ?{' '}
                <button
                  className="text-foreground font-medium hover:underline"
                  onClick={() => { setMode('signup'); setError(null); setSuccess(null) }}
                >
                  Créer un compte
                </button>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                <button
                  className="text-foreground font-medium hover:underline"
                  onClick={() => { setMode('login'); setError(null); setSuccess(null) }}
                >
                  Retour à la connexion
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
