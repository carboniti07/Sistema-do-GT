export function requirePerm(perm) {
  return (req, res, next) => {
    const u = req.user;
    if (!u) return res.status(401).json({ message: "Não autenticado" });
    if (u.role === "ADMIN") return next();
    if (u.permissions?.includes(perm)) return next();
    return res.status(403).json({ message: "Sem permissão" });
  };
}