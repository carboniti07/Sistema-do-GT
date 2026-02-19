import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import { Eye, EyeOff, Lock } from 'lucide-react';

import bgImg from '../../assets/bg-visitors.png';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();

    if (email === 'admin@umadrur.com' && senha === '123456') {
      localStorage.setItem('umadrur_auth', 'true');
      navigate('/admin/dashboard');
    } else {
      setError('Email ou senha incorretos');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(255,160,60,0.92), rgba(255,70,0,0.92)), url(${bgImg})`,
      }}
    >
      <Card className="w-full max-w-[520px] bg-card/92 backdrop-blur-sm border border-white/20 shadow-[0_18px_50px_rgba(0,0,0,0.18)] rounded-3xl">
        <div className="flex flex-col items-center">
          <Logo size="login" />
          <div className="mt-5 flex items-center gap-2 text-muted-foreground">
            <Lock size={16} />
            <span className="text-sm">Acesso Administrativo</span>
          </div>
        </div>

        <h1 className="text-2xl font-heading font-semibold text-foreground text-center mt-6">
          Painel UMADRUR
        </h1>
        <p className="text-muted-foreground text-center mt-2 mb-7">
          Entre com suas credenciais para continuar
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(v) => {
              setEmail(v);
              setError('');
            }}
            placeholder="seu@email.com"
            error={error ? true : false} // 👈 apenas ativa visual
          />

          <div className="relative">
            <Input
              label="Senha"
              type={showPass ? 'text' : 'password'}
              value={senha}
              onChange={(v) => {
                setSenha(v);
                setError('');
              }}
              placeholder="Sua senha"
              error={error ? true : false} // 👈 apenas ativa visual
            />

            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-9 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* 👇 mensagem aparece UMA única vez */}
          {error && (
            <p className="text-sm text-red-600 font-medium text-center">
              {error}
            </p>
          )}

          <Button type="submit" fullWidth className="mt-2">
            Entrar
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8 pt-6 border-t border-border">
          &copy; 2026 UMADRUR &ndash; Sistema Oficial | Desenvolvido por Carboni
        </p>
      </Card>
    </div>
  );
}
