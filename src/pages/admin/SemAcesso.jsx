import React from "react";
import AdminLayout from "../../components/AdminLayout";
import Card from "../../components/Card";

export default function SemAcesso() {
  return (
    <AdminLayout title="Sem acesso">
      <Card>
        <div className="p-4">
          <h2 className="text-lg font-semibold">Você não tem permissão</h2>
          <p className="text-sm opacity-80">
            Peça acesso ao administrador do sistema.
          </p>
        </div>
      </Card>
    </AdminLayout>
  );
}