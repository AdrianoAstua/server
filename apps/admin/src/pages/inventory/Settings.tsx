import { useState, useEffect } from 'react';
import {
  Store, Bell, MessageSquare, Mail,
  ShoppingBag, Users, Database, Save, Check,
  Eye, EyeOff, RefreshCw, Trash2, Plus,
  AlertTriangle, ChevronRight,
  Lock, Server, Download
} from 'lucide-react';

// ── Persistencia en localStorage ──────────────────────────────────────────────
const STORAGE_KEY = 'voneb_settings';

interface SettingsData {
  general: {
    businessName: string;
    currency: string;
    timezone: string;
    lowStockThreshold: number;
    criticalStockThreshold: number;
    language: string;
  };
  notifications: {
    whatsappEnabled: boolean;
    emailEnabled: boolean;
    panelEnabled: boolean;
    notifyLow: boolean;
    notifyCritical: boolean;
    notifyOutOfStock: boolean;
    notifyNewOrder: boolean;
  };
  whatsapp: {
    phoneNumber: string;
    apiToken: string;
    webhookUrl: string;
    autoReply: boolean;
    autoReplyMessage: string;
    businessId: string;
  };
  email: {
    fromEmail: string;
    fromName: string;
    smtpHost: string;
    smtpPort: string;
    notifyEmails: string;
  };
  shopify: {
    domain: string;
    apiKey: string;
    apiSecret: string;
    syncEnabled: boolean;
    syncDirection: 'voneb_to_shopify' | 'shopify_to_voneb' | 'bidirectional';
  };
  users: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'bodega' | 'ventas' | 'lectura';
    active: boolean;
  }[];
}

const DEFAULT_SETTINGS: SettingsData = {
  general: {
    businessName: 'V ONE B',
    currency: 'CRC',
    timezone: 'America/Costa_Rica',
    lowStockThreshold: 5,
    criticalStockThreshold: 2,
    language: 'es',
  },
  notifications: {
    whatsappEnabled: false,
    emailEnabled: false,
    panelEnabled: true,
    notifyLow: true,
    notifyCritical: true,
    notifyOutOfStock: true,
    notifyNewOrder: false,
  },
  whatsapp: {
    phoneNumber: '',
    apiToken: '',
    webhookUrl: '',
    autoReply: false,
    autoReplyMessage: 'Hola 👋 Gracias por escribir a V ONE B. Un momento, ya te atendemos.',
    businessId: '',
  },
  email: {
    fromEmail: '',
    fromName: 'V ONE B Sistema',
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    notifyEmails: '',
  },
  shopify: {
    domain: '',
    apiKey: '',
    apiSecret: '',
    syncEnabled: false,
    syncDirection: 'bidirectional',
  },
  users: [
    { id: '1', name: 'Admin Principal', email: 'admin@voneb.cr', role: 'admin', active: true },
  ],
};

function loadSettings(): SettingsData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function saveSettings(s: SettingsData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// ── Tipos de tabs ─────────────────────────────────────────────────────────────
type Tab = 'general' | 'notificaciones' | 'whatsapp' | 'email' | 'shopify' | 'usuarios' | 'sistema';

// ── Componentes base ──────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">
      {children}
    </h3>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#111111] border border-[#1E1E1E] rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

function Field({
  label, hint, children,
}: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-white">{label}</label>
      {hint && <p className="text-xs text-[#6B7280]">{hint}</p>}
      {children}
    </div>
  );
}

function Input({
  value, onChange, placeholder = '', type = 'text', disabled = false,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-white
        placeholder:text-[#4B5563] focus:outline-none focus:border-[#00FF88]/40 transition-colors
        disabled:opacity-40 disabled:cursor-not-allowed w-full"
    />
  );
}

function Select({
  value, onChange, children,
}: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-white
        focus:outline-none focus:border-[#00FF88]/40 transition-colors w-full"
    >
      {children}
    </select>
  );
}

function Toggle({
  enabled, onChange, label, desc,
}: {
  enabled: boolean; onChange: (v: boolean) => void; label: string; desc?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[#1E1E1E] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        {desc && <p className="text-xs text-[#6B7280] mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        role="switch"
        aria-checked={enabled}
        style={{
          flexShrink: 0,
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          width: '44px',
          height: '24px',
          borderRadius: '9999px',
          backgroundColor: enabled ? '#00FF88' : '#374151',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          padding: 0,
        }}
      >
        <span
          style={{
            display: 'block',
            width: '18px',
            height: '18px',
            borderRadius: '9999px',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
            transform: enabled ? 'translateX(23px)' : 'translateX(3px)',
            transition: 'transform 0.2s',
          }}
        />
      </button>
    </div>
  );
}

function PasswordInput({
  value, onChange, placeholder,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-white
          placeholder:text-[#4B5563] focus:outline-none focus:border-[#00FF88]/40 transition-colors w-full pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-white"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function RangeSetting({
  label, hint, value, onChange, min, max, unit,
}: {
  label: string; hint?: string; value: number;
  onChange: (v: number) => void; min: number; max: number; unit?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          {hint && <p className="text-xs text-[#6B7280]">{hint}</p>}
        </div>
        <span className="text-sm font-bold text-[#00FF88] min-w-[40px] text-right">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#00FF88', cursor: 'pointer' }}
      />
      <div className="flex justify-between text-xs text-[#4B5563]">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

function SaveBadge({ saved }: { saved: boolean }) {
  return saved ? (
    <span className="flex items-center gap-1 text-xs text-[#00FF88] font-medium">
      <Check className="w-3.5 h-3.5" /> Guardado
    </span>
  ) : null;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  bodega: 'Bodega',
  ventas: 'Ventas',
  lectura: 'Solo lectura',
};
const ROLE_COLORS: Record<string, string> = {
  admin: 'text-[#00FF88] bg-[#00FF88]/10 border-[#00FF88]/20',
  bodega: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20',
  ventas: 'text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/20',
  lectura: 'text-[#6B7280] bg-[#1A1A1A] border-[#2A2A2A]',
};

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'general',       label: 'General',        icon: Store },
  { id: 'notificaciones',label: 'Notificaciones',  icon: Bell },
  { id: 'whatsapp',      label: 'WhatsApp API',    icon: MessageSquare },
  { id: 'email',         label: 'Correo',          icon: Mail },
  { id: 'shopify',       label: 'Shopify',         icon: ShoppingBag },
  { id: 'usuarios',      label: 'Usuarios',        icon: Users },
  { id: 'sistema',       label: 'Sistema',         icon: Database },
];

// ── Tab: General ──────────────────────────────────────────────────────────────
function TabGeneral({ s, set }: { s: SettingsData; set: (s: SettingsData) => void }) {
  const g = s.general;
  const upd = (patch: Partial<typeof g>) => set({ ...s, general: { ...g, ...patch } });

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Negocio</SectionTitle>
        <div className="space-y-4">
          <Field label="Nombre del negocio">
            <Input value={g.businessName} onChange={v => upd({ businessName: v })} placeholder="V ONE B" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Moneda">
              <Select value={g.currency} onChange={v => upd({ currency: v })}>
                <option value="CRC">₡ Colón costarricense (CRC)</option>
                <option value="USD">$ Dólar americano (USD)</option>
              </Select>
            </Field>
            <Field label="Idioma">
              <Select value={g.language} onChange={v => upd({ language: v })}>
                <option value="es">Español</option>
                <option value="en">English</option>
              </Select>
            </Field>
          </div>
          <Field label="Zona horaria">
            <Select value={g.timezone} onChange={v => upd({ timezone: v })}>
              <option value="America/Costa_Rica">América/Costa Rica (GMT-6)</option>
              <option value="America/Mexico_City">América/Ciudad de México (GMT-6)</option>
              <option value="America/Bogota">América/Bogotá (GMT-5)</option>
              <option value="America/New_York">América/New York (GMT-5)</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card>
        <SectionTitle>Umbrales de stock</SectionTitle>
        <div className="space-y-5">
          <RangeSetting
            label="Stock bajo"
            hint="Se muestra en naranja — necesita reposición pronto"
            value={g.lowStockThreshold}
            onChange={v => upd({ lowStockThreshold: v })}
            min={1} max={20}
            unit=" uds"
          />
          <div className="h-px bg-[#1E1E1E]" />
          <RangeSetting
            label="Stock crítico"
            hint="Se muestra en rojo — urgente reponer"
            value={g.criticalStockThreshold}
            onChange={v => upd({ criticalStockThreshold: Math.min(v, g.lowStockThreshold - 1) })}
            min={0} max={10}
            unit=" uds"
          />
          <div className="bg-[#1A1A1A] rounded-lg p-3 flex items-start gap-2 text-xs text-[#6B7280]">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
            <span>
              Con estos valores: stock ≤ <strong className="text-[#F59E0B]">{g.lowStockThreshold}</strong> = bajo,
              stock ≤ <strong className="text-[#EF4444]">{g.criticalStockThreshold}</strong> = crítico,
              stock = <strong className="text-[#6B7280]">0</strong> = agotado.
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Tab: Notificaciones ───────────────────────────────────────────────────────
function TabNotificaciones({ s, set }: { s: SettingsData; set: (s: SettingsData) => void }) {
  const n = s.notifications;
  const upd = (patch: Partial<typeof n>) => set({ ...s, notifications: { ...n, ...patch } });

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Canales de notificación</SectionTitle>
        <Toggle enabled={n.panelEnabled}    onChange={v => upd({ panelEnabled: v })}    label="Panel admin"   desc="Alertas visibles en el sidebar del panel" />
        <Toggle enabled={n.whatsappEnabled} onChange={v => upd({ whatsappEnabled: v })} label="WhatsApp"      desc="Requiere WhatsApp API configurada en la pestaña correspondiente" />
        <Toggle enabled={n.emailEnabled}    onChange={v => upd({ emailEnabled: v })}    label="Correo electrónico" desc="Requiere correo SMTP configurado en la pestaña Correo" />
      </Card>

      <Card>
        <SectionTitle>¿Cuándo notificar?</SectionTitle>
        <Toggle enabled={n.notifyCritical}  onChange={v => upd({ notifyCritical: v })}  label="Stock crítico"    desc={`Cuando una variante baje de ${s.general.criticalStockThreshold} unidades`} />
        <Toggle enabled={n.notifyLow}       onChange={v => upd({ notifyLow: v })}       label="Stock bajo"       desc={`Cuando una variante baje de ${s.general.lowStockThreshold} unidades`} />
        <Toggle enabled={n.notifyOutOfStock} onChange={v => upd({ notifyOutOfStock: v })} label="Producto agotado" desc="Cuando el stock llegue a 0" />
        <Toggle enabled={n.notifyNewOrder}  onChange={v => upd({ notifyNewOrder: v })}  label="Nuevo pedido"     desc="Cuando se registre un pedido en el sistema" />
      </Card>

      {!n.whatsappEnabled && !n.emailEnabled && (
        <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[#F59E0B]">Solo notificaciones en panel</p>
            <p className="text-xs text-[#6B7280] mt-1">
              Para recibir alertas por WhatsApp o correo, activa esos canales y configúralos en sus pestañas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: WhatsApp ─────────────────────────────────────────────────────────────
function TabWhatsApp({ s, set }: { s: SettingsData; set: (s: SettingsData) => void }) {
  const w = s.whatsapp;
  const upd = (patch: Partial<typeof w>) => set({ ...s, whatsapp: { ...w, ...patch } });

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <div className={`rounded-xl p-4 flex items-start gap-3 ${
        w.apiToken
          ? 'bg-[#00FF88]/5 border border-[#00FF88]/20'
          : 'bg-[#1A1A1A] border border-[#2A2A2A]'
      }`}>
        <MessageSquare className={`w-5 h-5 flex-shrink-0 mt-0.5 ${w.apiToken ? 'text-[#00FF88]' : 'text-[#4B5563]'}`} />
        <div>
          <p className={`text-sm font-semibold ${w.apiToken ? 'text-[#00FF88]' : 'text-[#6B7280]'}`}>
            {w.apiToken ? 'WhatsApp API configurada' : 'WhatsApp API no configurada'}
          </p>
          <p className="text-xs text-[#6B7280] mt-1">
            Necesitas una cuenta de{' '}
            <a href="https://business.facebook.com" target="_blank" rel="noopener"
              className="text-[#3B82F6] hover:underline">Meta Business Manager</a>{' '}
            y un número dedicado no usado en WhatsApp personal.
          </p>
        </div>
      </div>

      <Card>
        <SectionTitle>Credenciales Meta / WhatsApp Cloud API</SectionTitle>
        <div className="space-y-4">
          <Field label="Business Account ID" hint="Encuéntralo en Meta Business Manager → Configuración">
            <Input value={w.businessId} onChange={v => upd({ businessId: v })} placeholder="123456789012345" />
          </Field>
          <Field label="Número de teléfono (con código de país)" hint="Ej: +50688887777 — debe estar verificado en Meta">
            <Input value={w.phoneNumber} onChange={v => upd({ phoneNumber: v })} placeholder="+506 8888 7777" />
          </Field>
          <Field label="Token de acceso (Access Token)" hint="Token permanente generado en Meta for Developers">
            <PasswordInput value={w.apiToken} onChange={v => upd({ apiToken: v })} placeholder="EAAxxxxxxxxxxxxxxx..." />
          </Field>
          <Field label="Webhook URL" hint="URL pública donde el sistema recibirá los mensajes entrantes">
            <Input value={w.webhookUrl} onChange={v => upd({ webhookUrl: v })} placeholder="https://api.voneb.cr/webhooks/whatsapp" />
          </Field>
        </div>
      </Card>

      <Card>
        <SectionTitle>Respuesta automática</SectionTitle>
        <div className="space-y-4">
          <Toggle
            enabled={w.autoReply}
            onChange={v => upd({ autoReply: v })}
            label="Activar respuesta automática"
            desc="Envía un mensaje al primer contacto de un cliente nuevo"
          />
          {w.autoReply && (
            <Field label="Mensaje de bienvenida">
              <textarea
                value={w.autoReplyMessage}
                onChange={e => upd({ autoReplyMessage: e.target.value })}
                rows={3}
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-white
                  placeholder:text-[#4B5563] focus:outline-none focus:border-[#00FF88]/40 transition-colors w-full resize-none"
              />
            </Field>
          )}
        </div>
      </Card>

      <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Pasos para configurar</p>
        {[
          { n: 1, text: 'Crear cuenta en Meta Business Manager (business.facebook.com)' },
          { n: 2, text: 'Agregar y verificar número de teléfono dedicado en WhatsApp Business' },
          { n: 3, text: 'Crear una app en Meta for Developers y habilitar WhatsApp' },
          { n: 4, text: 'Generar un token permanente y pegarlo arriba' },
          { n: 5, text: 'Configurar la URL del webhook para recibir mensajes' },
        ].map(step => (
          <div key={step.n} className="flex items-start gap-3 mb-3 last:mb-0">
            <span className="w-5 h-5 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-xs flex items-center justify-center text-[#6B7280] flex-shrink-0 mt-0.5">
              {step.n}
            </span>
            <p className="text-xs text-[#9CA3AF]">{step.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Email ────────────────────────────────────────────────────────────────
function TabEmail({ s, set }: { s: SettingsData; set: (s: SettingsData) => void }) {
  const e = s.email;
  const upd = (patch: Partial<typeof e>) => set({ ...s, email: { ...e, ...patch } });

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Remitente</SectionTitle>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre del remitente">
              <Input value={e.fromName} onChange={v => upd({ fromName: v })} placeholder="V ONE B Sistema" />
            </Field>
            <Field label="Correo del remitente">
              <Input value={e.fromEmail} onChange={v => upd({ fromEmail: v })} placeholder="no-reply@voneb.cr" type="email" />
            </Field>
          </div>
          <Field label="Correos para notificaciones" hint="Separados por coma — reciben alertas de stock, pedidos, etc.">
            <Input value={e.notifyEmails} onChange={v => upd({ notifyEmails: v })} placeholder="admin@voneb.cr, bodega@voneb.cr" />
          </Field>
        </div>
      </Card>

      <Card>
        <SectionTitle>Configuración SMTP</SectionTitle>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Servidor SMTP">
              <Input value={e.smtpHost} onChange={v => upd({ smtpHost: v })} placeholder="smtp.gmail.com" />
            </Field>
            <Field label="Puerto">
              <Input value={e.smtpPort} onChange={v => upd({ smtpPort: v })} placeholder="587" />
            </Field>
          </div>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3 text-xs text-[#6B7280] space-y-1.5">
            <p className="font-semibold text-[#9CA3AF]">Servidores comunes:</p>
            <p>📧 <strong className="text-white">Gmail:</strong> smtp.gmail.com · puerto 587 (requiere App Password)</p>
            <p>📧 <strong className="text-white">Outlook:</strong> smtp.office365.com · puerto 587</p>
            <p>📧 <strong className="text-white">Dominio propio:</strong> mail.tudominio.cr · puerto 465</p>
          </div>
        </div>
      </Card>

      <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-xl p-4 flex items-start gap-3">
        <Lock className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[#F59E0B]">Si usas Gmail</p>
          <p className="text-xs text-[#6B7280] mt-1">
            Activa la verificación en dos pasos y genera una <strong className="text-[#9CA3AF]">App Password</strong> específica
            para este sistema en myaccount.google.com → Seguridad → Contraseñas de aplicación.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Shopify ──────────────────────────────────────────────────────────────
function TabShopify({ s, set }: { s: SettingsData; set: (s: SettingsData) => void }) {
  const sh = s.shopify;
  const upd = (patch: Partial<typeof sh>) => set({ ...s, shopify: { ...sh, ...patch } });

  return (
    <div className="space-y-5">
      <div className={`rounded-xl p-4 flex items-start gap-3 ${
        sh.domain && sh.apiKey
          ? 'bg-[#00FF88]/5 border border-[#00FF88]/20'
          : 'bg-[#1A1A1A] border border-[#2A2A2A]'
      }`}>
        <ShoppingBag className={`w-5 h-5 flex-shrink-0 mt-0.5 ${sh.domain && sh.apiKey ? 'text-[#00FF88]' : 'text-[#4B5563]'}`} />
        <div>
          <p className={`text-sm font-semibold ${sh.domain && sh.apiKey ? 'text-[#00FF88]' : 'text-[#6B7280]'}`}>
            {sh.domain && sh.apiKey ? `Conectado a ${sh.domain}` : 'Shopify no conectado'}
          </p>
          <p className="text-xs text-[#6B7280] mt-1">
            La sincronización permite que el inventario se actualice automáticamente cuando hay ventas en Shopify.
          </p>
        </div>
      </div>

      <Card>
        <SectionTitle>Credenciales de la tienda</SectionTitle>
        <div className="space-y-4">
          <Field label="Dominio de Shopify" hint="Ej: voneb.myshopify.com o tu dominio propio">
            <Input value={sh.domain} onChange={v => upd({ domain: v })} placeholder="voneb.myshopify.com" />
          </Field>
          <Field label="API Key" hint="En Shopify Admin → Configuración → Apps → Desarrollar apps">
            <Input value={sh.apiKey} onChange={v => upd({ apiKey: v })} placeholder="shpat_xxxxxxxxxxxxxxxx" />
          </Field>
          <Field label="API Secret Key">
            <PasswordInput value={sh.apiSecret} onChange={v => upd({ apiSecret: v })} placeholder="shpss_xxxxxxxxxxxxxxxx" />
          </Field>
        </div>
      </Card>

      <Card>
        <SectionTitle>Sincronización</SectionTitle>
        <div className="space-y-4">
          <Toggle
            enabled={sh.syncEnabled}
            onChange={v => upd({ syncEnabled: v })}
            label="Sincronización activa"
            desc="Mantiene el inventario alineado entre este sistema y Shopify"
          />
          {sh.syncEnabled && (
            <Field label="Dirección de sincronización">
              <Select value={sh.syncDirection} onChange={v => upd({ syncDirection: v as typeof sh.syncDirection })}>
                <option value="bidirectional">↔ Bidireccional (recomendado)</option>
                <option value="voneb_to_shopify">→ Solo V ONE B → Shopify</option>
                <option value="shopify_to_voneb">← Solo Shopify → V ONE B</option>
              </Select>
            </Field>
          )}
        </div>
      </Card>

      <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Cómo obtener las credenciales</p>
        {[
          'Entra a tu Shopify Admin → Configuración → Apps y canales de ventas',
          'Haz clic en "Desarrollar apps" y crea una app nueva',
          'En la app, ve a "Permisos de API de administración" y activa: read_inventory, write_inventory, read_products',
          'Instala la app y copia el Access Token (API Key)',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
            <span className="w-5 h-5 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-xs flex items-center justify-center text-[#6B7280] flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            <p className="text-xs text-[#9CA3AF]">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Usuarios ─────────────────────────────────────────────────────────────
function TabUsuarios({ s, set }: { s: SettingsData; set: (s: SettingsData) => void }) {
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'ventas' as const });
  const [adding, setAdding] = useState(false);

  const addUser = () => {
    if (!newUser.name || !newUser.email) return;
    const u = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      active: true,
    };
    set({ ...s, users: [...s.users, u] });
    setNewUser({ name: '', email: '', role: 'ventas' });
    setAdding(false);
  };

  const toggleUser = (id: string) => {
    set({ ...s, users: s.users.map(u => u.id === id ? { ...u, active: !u.active } : u) });
  };

  const removeUser = (id: string) => {
    if (s.users.length <= 1) return;
    set({ ...s, users: s.users.filter(u => u.id !== id) });
  };

  const changeRole = (id: string, role: 'admin' | 'bodega' | 'ventas' | 'lectura') => {
    set({ ...s, users: s.users.map(u => u.id === id ? { ...u, role } : u) });
  };

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Usuarios del panel</SectionTitle>
          <button
            onClick={() => setAdding(a => !a)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#00FF88] hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar usuario
          </button>
        </div>

        {adding && (
          <div className="bg-[#1A1A1A] border border-[#00FF88]/20 rounded-xl p-4 mb-4 space-y-3">
            <p className="text-xs font-semibold text-[#00FF88]">Nuevo usuario</p>
            <div className="grid grid-cols-2 gap-3">
              <Input value={newUser.name}  onChange={v => setNewUser(n => ({ ...n, name: v }))}  placeholder="Nombre completo" />
              <Input value={newUser.email} onChange={v => setNewUser(n => ({ ...n, email: v }))} placeholder="correo@voneb.cr" type="email" />
            </div>
            <Select value={newUser.role} onChange={v => setNewUser(n => ({ ...n, role: v as typeof newUser.role }))}>
              <option value="admin">Admin — Acceso total</option>
              <option value="bodega">Bodega — Solo inventario</option>
              <option value="ventas">Ventas — Pedidos y clientes</option>
              <option value="lectura">Solo lectura — Ver reportes</option>
            </Select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAdding(false)} className="text-xs text-[#6B7280] hover:text-white px-3 py-1.5">
                Cancelar
              </button>
              <button
                onClick={addUser}
                disabled={!newUser.name || !newUser.email}
                className="text-xs bg-[#00FF88] text-black font-bold px-4 py-1.5 rounded-lg disabled:opacity-40"
              >
                Agregar
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {s.users.map(u => (
            <div
              key={u.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                u.active ? 'bg-[#111111] border-[#1E1E1E]' : 'bg-[#0F0F0F] border-[#1A1A1A] opacity-50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-[#6B7280]">{u.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{u.name}</p>
                <p className="text-xs text-[#6B7280] truncate">{u.email}</p>
              </div>
              <select
                value={u.role}
                onChange={e => changeRole(u.id, e.target.value as 'admin' | 'bodega' | 'ventas' | 'lectura')}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer bg-transparent ${ROLE_COLORS[u.role]}`}
              >
                <option value="admin">Admin</option>
                <option value="bodega">Bodega</option>
                <option value="ventas">Ventas</option>
                <option value="lectura">Solo lectura</option>
              </select>
              <button
                onClick={() => toggleUser(u.id)}
                className="text-xs text-[#6B7280] hover:text-white px-2"
                title={u.active ? 'Desactivar' : 'Activar'}
              >
                {u.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              {s.users.length > 1 && (
                <button onClick={() => removeUser(u.id)} className="text-[#6B7280] hover:text-[#EF4444]">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Descripción de roles</SectionTitle>
        <div className="space-y-3">
          {[
            { role: 'admin',   icon: '🔑', perms: 'Acceso total — puede borrar productos, cambiar precios, configurar el sistema y gestionar usuarios' },
            { role: 'bodega',  icon: '📦', perms: 'Inventario, movimientos de stock y alertas — no ve costos ni márgenes' },
            { role: 'ventas',  icon: '🛒', perms: 'Pedidos, clientes y stock disponible — no puede editar precios ni ver costos' },
            { role: 'lectura', icon: '👁️', perms: 'Solo puede ver reportes y dashboard — sin permisos de edición' },
          ].map(r => (
            <div key={r.role} className="flex items-start gap-3">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border flex-shrink-0 mt-0.5 ${ROLE_COLORS[r.role]}`}>
                {ROLE_LABELS[r.role]}
              </span>
              <p className="text-xs text-[#6B7280]">{r.perms}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Tab: Sistema ──────────────────────────────────────────────────────────────
function TabSistema({ s, set }: { s: SettingsData; set: (s: SettingsData) => void }) {
  const [resetConfirm, setResetConfirm] = useState(false);

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voneb_config_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          set({ ...DEFAULT_SETTINGS, ...data });
        } catch {
          alert('Archivo de configuración inválido');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const resetAll = () => {
    set(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    setResetConfirm(false);
  };

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Información del sistema</SectionTitle>
        <div className="space-y-2">
          {[
            { label: 'Versión del panel', value: 'v1.0.0' },
            { label: 'Entorno', value: 'Desarrollo local' },
            { label: 'Base de datos', value: 'Mock / LocalStorage' },
            { label: 'Última configuración guardada', value: localStorage.getItem(STORAGE_KEY) ? 'Disponible' : 'Sin guardar aún' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-[#1E1E1E] last:border-0">
              <span className="text-sm text-[#6B7280]">{row.label}</span>
              <span className="text-sm font-medium text-white">{row.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Respaldo de configuración</SectionTitle>
        <div className="space-y-3">
          <button
            onClick={exportConfig}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl hover:border-[#00FF88]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Download className="w-4 h-4 text-[#00FF88]" />
              <div className="text-left">
                <p className="text-sm font-medium text-white">Exportar configuración</p>
                <p className="text-xs text-[#6B7280]">Descarga un archivo .json con todos los ajustes</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#4B5563]" />
          </button>

          <button
            onClick={importConfig}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl hover:border-[#3B82F6]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Server className="w-4 h-4 text-[#3B82F6]" />
              <div className="text-left">
                <p className="text-sm font-medium text-white">Importar configuración</p>
                <p className="text-xs text-[#6B7280]">Restaura ajustes desde un archivo .json anterior</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#4B5563]" />
          </button>
        </div>
      </Card>

      <Card>
        <SectionTitle>Zona de peligro</SectionTitle>
        {!resetConfirm ? (
          <button
            onClick={() => setResetConfirm(true)}
            className="flex items-center gap-2 text-sm font-medium text-[#EF4444] hover:underline"
          >
            <RefreshCw className="w-4 h-4" />
            Restablecer configuración a valores por defecto
          </button>
        ) : (
          <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-xl p-4">
            <p className="text-sm font-semibold text-[#EF4444] mb-2">¿Seguro que quieres restablecer todo?</p>
            <p className="text-xs text-[#6B7280] mb-4">
              Esto borrará WhatsApp API, Shopify, correo y todos los usuarios (menos el admin principal). No se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={resetAll}
                className="px-4 py-2 bg-[#EF4444] text-white text-xs font-bold rounded-lg hover:bg-[#DC2626]"
              >
                Sí, restablecer
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="px-4 py-2 text-[#6B7280] text-xs font-medium hover:text-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export function InventorySettings() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettingsState] = useState<SettingsData>(loadSettings);
  const [saved, setSaved] = useState(false);

  const setSettings = (s: SettingsData) => {
    setSettingsState(s);
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Auto-save en cambios
  useEffect(() => {
    const t = setTimeout(() => {
      saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1200);
    return () => clearTimeout(t);
  }, [settings]);

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] overflow-hidden">
      {/* Encabezado */}
      <div className="flex-shrink-0 border-b border-[#1E1E1E] bg-[#0A0A0A] px-5 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Configuración</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">Ajustes del sistema de inventario V ONE B</p>
          </div>
          <div className="flex items-center gap-3">
            <SaveBadge saved={saved} />
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-[#00FF88] text-black text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#00DD77] transition-colors"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-none">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-[#00FF88] border-[#00FF88]'
                  : 'text-[#6B7280] border-transparent hover:text-white'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'general'        && <TabGeneral        s={settings} set={setSettings} />}
        {activeTab === 'notificaciones' && <TabNotificaciones s={settings} set={setSettings} />}
        {activeTab === 'whatsapp'       && <TabWhatsApp       s={settings} set={setSettings} />}
        {activeTab === 'email'          && <TabEmail          s={settings} set={setSettings} />}
        {activeTab === 'shopify'        && <TabShopify        s={settings} set={setSettings} />}
        {activeTab === 'usuarios'       && <TabUsuarios       s={settings} set={setSettings} />}
        {activeTab === 'sistema'        && <TabSistema        s={settings} set={setSettings} />}
      </div>
    </div>
  );
}
