import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Store, Bell, MessageSquare, Mail, ShoppingBag, Users, Database, Save, Check, Eye, EyeOff, RefreshCw, Trash2, Plus, AlertTriangle, ChevronRight, Lock, Server, Download } from 'lucide-react';
// ── Persistencia en localStorage ──────────────────────────────────────────────
const STORAGE_KEY = 'voneb_settings';
const DEFAULT_SETTINGS = {
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
function loadSettings() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored)
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
    catch { /* ignore */ }
    return DEFAULT_SETTINGS;
}
function saveSettings(s) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}
// ── Componentes base ──────────────────────────────────────────────────────────
function SectionTitle({ children }) {
    return (_jsx("h3", { className: "text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3", children: children }));
}
function Card({ children, className = '' }) {
    return (_jsx("div", { className: `bg-[#111111] border border-[#1E1E1E] rounded-xl p-5 ${className}`, children: children }));
}
function Field({ label, hint, children, }) {
    return (_jsxs("div", { className: "flex flex-col gap-1.5", children: [_jsx("label", { className: "text-sm font-medium text-white", children: label }), hint && _jsx("p", { className: "text-xs text-[#6B7280]", children: hint }), children] }));
}
function Input({ value, onChange, placeholder = '', type = 'text', disabled = false, }) {
    return (_jsx("input", { type: type, value: value, onChange: e => onChange(e.target.value), placeholder: placeholder, disabled: disabled, className: "bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-white\n        placeholder:text-[#4B5563] focus:outline-none focus:border-[#00FF88]/40 transition-colors\n        disabled:opacity-40 disabled:cursor-not-allowed w-full" }));
}
function Select({ value, onChange, children, }) {
    return (_jsx("select", { value: value, onChange: e => onChange(e.target.value), className: "bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-white\n        focus:outline-none focus:border-[#00FF88]/40 transition-colors w-full", children: children }));
}
function Toggle({ enabled, onChange, label, desc, }) {
    return (_jsxs("div", { className: "flex items-center justify-between gap-4 py-3 border-b border-[#1E1E1E] last:border-0", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-white", children: label }), desc && _jsx("p", { className: "text-xs text-[#6B7280] mt-0.5", children: desc })] }), _jsx("button", { onClick: () => onChange(!enabled), role: "switch", "aria-checked": enabled, style: {
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
                }, children: _jsx("span", { style: {
                        display: 'block',
                        width: '18px',
                        height: '18px',
                        borderRadius: '9999px',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                        transform: enabled ? 'translateX(23px)' : 'translateX(3px)',
                        transition: 'transform 0.2s',
                    } }) })] }));
}
function PasswordInput({ value, onChange, placeholder, }) {
    const [show, setShow] = useState(false);
    return (_jsxs("div", { className: "relative", children: [_jsx("input", { type: show ? 'text' : 'password', value: value, onChange: e => onChange(e.target.value), placeholder: placeholder, className: "bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-white\n          placeholder:text-[#4B5563] focus:outline-none focus:border-[#00FF88]/40 transition-colors w-full pr-10" }), _jsx("button", { type: "button", onClick: () => setShow(s => !s), className: "absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-white", children: show ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] }));
}
function RangeSetting({ label, hint, value, onChange, min, max, unit, }) {
    return (_jsxs("div", { className: "flex flex-col gap-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-white", children: label }), hint && _jsx("p", { className: "text-xs text-[#6B7280]", children: hint })] }), _jsxs("span", { className: "text-sm font-bold text-[#00FF88] min-w-[40px] text-right", children: [value, unit] })] }), _jsx("input", { type: "range", min: min, max: max, value: value, onChange: e => onChange(Number(e.target.value)), style: { width: '100%', accentColor: '#00FF88', cursor: 'pointer' } }), _jsxs("div", { className: "flex justify-between text-xs text-[#4B5563]", children: [_jsxs("span", { children: [min, unit] }), _jsxs("span", { children: [max, unit] })] })] }));
}
function SaveBadge({ saved }) {
    return saved ? (_jsxs("span", { className: "flex items-center gap-1 text-xs text-[#00FF88] font-medium", children: [_jsx(Check, { className: "w-3.5 h-3.5" }), " Guardado"] })) : null;
}
const ROLE_LABELS = {
    admin: 'Admin',
    bodega: 'Bodega',
    ventas: 'Ventas',
    lectura: 'Solo lectura',
};
const ROLE_COLORS = {
    admin: 'text-[#00FF88] bg-[#00FF88]/10 border-[#00FF88]/20',
    bodega: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20',
    ventas: 'text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/20',
    lectura: 'text-[#6B7280] bg-[#1A1A1A] border-[#2A2A2A]',
};
// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'whatsapp', label: 'WhatsApp API', icon: MessageSquare },
    { id: 'email', label: 'Correo', icon: Mail },
    { id: 'shopify', label: 'Shopify', icon: ShoppingBag },
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'sistema', label: 'Sistema', icon: Database },
];
// ── Tab: General ──────────────────────────────────────────────────────────────
function TabGeneral({ s, set }) {
    const g = s.general;
    const upd = (patch) => set({ ...s, general: { ...g, ...patch } });
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs(Card, { children: [_jsx(SectionTitle, { children: "Negocio" }), _jsxs("div", { className: "space-y-4", children: [_jsx(Field, { label: "Nombre del negocio", children: _jsx(Input, { value: g.businessName, onChange: v => upd({ businessName: v }), placeholder: "V ONE B" }) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Field, { label: "Moneda", children: _jsxs(Select, { value: g.currency, onChange: v => upd({ currency: v }), children: [_jsx("option", { value: "CRC", children: "\u20A1 Col\u00F3n costarricense (CRC)" }), _jsx("option", { value: "USD", children: "$ D\u00F3lar americano (USD)" })] }) }), _jsx(Field, { label: "Idioma", children: _jsxs(Select, { value: g.language, onChange: v => upd({ language: v }), children: [_jsx("option", { value: "es", children: "Espa\u00F1ol" }), _jsx("option", { value: "en", children: "English" })] }) })] }), _jsx(Field, { label: "Zona horaria", children: _jsxs(Select, { value: g.timezone, onChange: v => upd({ timezone: v }), children: [_jsx("option", { value: "America/Costa_Rica", children: "Am\u00E9rica/Costa Rica (GMT-6)" }), _jsx("option", { value: "America/Mexico_City", children: "Am\u00E9rica/Ciudad de M\u00E9xico (GMT-6)" }), _jsx("option", { value: "America/Bogota", children: "Am\u00E9rica/Bogot\u00E1 (GMT-5)" }), _jsx("option", { value: "America/New_York", children: "Am\u00E9rica/New York (GMT-5)" })] }) })] })] }), _jsxs(Card, { children: [_jsx(SectionTitle, { children: "Umbrales de stock" }), _jsxs("div", { className: "space-y-5", children: [_jsx(RangeSetting, { label: "Stock bajo", hint: "Se muestra en naranja \u2014 necesita reposici\u00F3n pronto", value: g.lowStockThreshold, onChange: v => upd({ lowStockThreshold: v }), min: 1, max: 20, unit: " uds" }), _jsx("div", { className: "h-px bg-[#1E1E1E]" }), _jsx(RangeSetting, { label: "Stock cr\u00EDtico", hint: "Se muestra en rojo \u2014 urgente reponer", value: g.criticalStockThreshold, onChange: v => upd({ criticalStockThreshold: Math.min(v, g.lowStockThreshold - 1) }), min: 0, max: 10, unit: " uds" }), _jsxs("div", { className: "bg-[#1A1A1A] rounded-lg p-3 flex items-start gap-2 text-xs text-[#6B7280]", children: [_jsx(AlertTriangle, { className: "w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" }), _jsxs("span", { children: ["Con estos valores: stock \u2264 ", _jsx("strong", { className: "text-[#F59E0B]", children: g.lowStockThreshold }), " = bajo, stock \u2264 ", _jsx("strong", { className: "text-[#EF4444]", children: g.criticalStockThreshold }), " = cr\u00EDtico, stock = ", _jsx("strong", { className: "text-[#6B7280]", children: "0" }), " = agotado."] })] })] })] })] }));
}
// ── Tab: Notificaciones ───────────────────────────────────────────────────────
function TabNotificaciones({ s, set }) {
    const n = s.notifications;
    const upd = (patch) => set({ ...s, notifications: { ...n, ...patch } });
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs(Card, { children: [_jsx(SectionTitle, { children: "Canales de notificaci\u00F3n" }), _jsx(Toggle, { enabled: n.panelEnabled, onChange: v => upd({ panelEnabled: v }), label: "Panel admin", desc: "Alertas visibles en el sidebar del panel" }), _jsx(Toggle, { enabled: n.whatsappEnabled, onChange: v => upd({ whatsappEnabled: v }), label: "WhatsApp", desc: "Requiere WhatsApp API configurada en la pesta\u00F1a correspondiente" }), _jsx(Toggle, { enabled: n.emailEnabled, onChange: v => upd({ emailEnabled: v }), label: "Correo electr\u00F3nico", desc: "Requiere correo SMTP configurado en la pesta\u00F1a Correo" })] }), _jsxs(Card, { children: [_jsx(SectionTitle, { children: "\u00BFCu\u00E1ndo notificar?" }), _jsx(Toggle, { enabled: n.notifyCritical, onChange: v => upd({ notifyCritical: v }), label: "Stock cr\u00EDtico", desc: `Cuando una variante baje de ${s.general.criticalStockThreshold} unidades` }), _jsx(Toggle, { enabled: n.notifyLow, onChange: v => upd({ notifyLow: v }), label: "Stock bajo", desc: `Cuando una variante baje de ${s.general.lowStockThreshold} unidades` }), _jsx(Toggle, { enabled: n.notifyOutOfStock, onChange: v => upd({ notifyOutOfStock: v }), label: "Producto agotado", desc: "Cuando el stock llegue a 0" }), _jsx(Toggle, { enabled: n.notifyNewOrder, onChange: v => upd({ notifyNewOrder: v }), label: "Nuevo pedido", desc: "Cuando se registre un pedido en el sistema" })] }), !n.whatsappEnabled && !n.emailEnabled && (_jsxs("div", { className: "bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-xl p-4 flex items-start gap-3", children: [_jsx(AlertTriangle, { className: "w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-[#F59E0B]", children: "Solo notificaciones en panel" }), _jsx("p", { className: "text-xs text-[#6B7280] mt-1", children: "Para recibir alertas por WhatsApp o correo, activa esos canales y config\u00FAralos en sus pesta\u00F1as." })] })] }))] }));
}
// ── Tab: WhatsApp ─────────────────────────────────────────────────────────────
function TabWhatsApp({ s, set }) {
    const w = s.whatsapp;
    const upd = (patch) => set({ ...s, whatsapp: { ...w, ...patch } });
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: `rounded-xl p-4 flex items-start gap-3 ${w.apiToken
                    ? 'bg-[#00FF88]/5 border border-[#00FF88]/20'
                    : 'bg-[#1A1A1A] border border-[#2A2A2A]'}`, children: [_jsx(MessageSquare, { className: `w-5 h-5 flex-shrink-0 mt-0.5 ${w.apiToken ? 'text-[#00FF88]' : 'text-[#4B5563]'}` }), _jsxs("div", { children: [_jsx("p", { className: `text-sm font-semibold ${w.apiToken ? 'text-[#00FF88]' : 'text-[#6B7280]'}`, children: w.apiToken ? 'WhatsApp API configurada' : 'WhatsApp API no configurada' }), _jsxs("p", { className: "text-xs text-[#6B7280] mt-1", children: ["Necesitas una cuenta de", ' ', _jsx("a", { href: "https://business.facebook.com", target: "_blank", rel: "noopener", className: "text-[#3B82F6] hover:underline", children: "Meta Business Manager" }), ' ', "y un n\u00FAmero dedicado no usado en WhatsApp personal."] })] })] }), _jsxs(Card, { children: [_jsx(SectionTitle, { children: "Credenciales Meta / WhatsApp Cloud API" }), _jsxs("div", { className: "space-y-4", children: [_jsx(Field, { label: "Business Account ID", hint: "Encu\u00E9ntralo en Meta Business Manager \u2192 Configuraci\u00F3n", children: _jsx(Input, { value: w.businessId, onChange: v => upd({ businessId: v }), placeholder: "123456789012345" }) }), _jsx(Field, { label: "N\u00FAmero de tel\u00E9fono (con c\u00F3digo de pa\u00EDs)", hint: "Ej: +50688887777 \u2014 debe estar verificado en Meta", children: _jsx(Input, { value: w.phoneNumber, onChange: v => upd({ phoneNumber: v }), placeholder: "+506 8888 7777" }) }), _jsx(Field, { label: "Token de acceso (Access Token)", hint: "Token permanente generado en Meta for Developers", children: _jsx(PasswordInput, { value: w.apiToken, onChange: v => upd({ apiToken: v }), placeholder: "EAAxxxxxxxxxxxxxxx..." }) }), _jsx(Field, { label: "Webhook URL", hint: "URL p\u00FAblica donde el sistema recibir\u00E1 los mensajes entrantes", children: _jsx(Input, { value: w.webhookUrl, onChange: v => upd({ webhookUrl: v }), placeholder: "https://api.voneb.cr/webhooks/whatsapp" }) })] })] }), _jsxs(Card, { children: [_jsx(SectionTitle, { children: "Respuesta autom\u00E1tica" }), _jsxs("div", { className: "space-y-4", children: [_jsx(Toggle, { enabled: w.autoReply, onChange: v => upd({ autoReply: v }), label: "Activar respuesta autom\u00E1tica", desc: "Env\u00EDa un mensaje al primer contacto de un cliente nuevo" }), w.autoReply && (_jsx(Field, { label: "Mensaje de bienvenida", children: _jsx("textarea", { value: w.autoReplyMessage, onChange: e => upd({ autoReplyMessage: e.target.value }), rows: 3, className: "bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-white\n                  placeholder:text-[#4B5563] focus:outline-none focus:border-[#00FF88]/40 transition-colors w-full resize-none" }) }))] })] }), _jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-4", children: [_jsx("p", { className: "text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3", children: "Pasos para configurar" }), [
                        { n: 1, text: 'Crear cuenta en Meta Business Manager (business.facebook.com)' },
                        { n: 2, text: 'Agregar y verificar número de teléfono dedicado en WhatsApp Business' },
                        { n: 3, text: 'Crear una app en Meta for Developers y habilitar WhatsApp' },
                        { n: 4, text: 'Generar un token permanente y pegarlo arriba' },
                        { n: 5, text: 'Configurar la URL del webhook para recibir mensajes' },
                    ].map(step => (_jsxs("div", { className: "flex items-start gap-3 mb-3 last:mb-0", children: [_jsx("span", { className: "w-5 h-5 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-xs flex items-center justify-center text-[#6B7280] flex-shrink-0 mt-0.5", children: step.n }), _jsx("p", { className: "text-xs text-[#9CA3AF]", children: step.text })] }, step.n)))] })] }));
}
// ── Tab: Email ────────────────────────────────────────────────────────────────
function TabEmail({ s, set }) {
    const e = s.email;
    const upd = (patch) => set({ ...s, email: { ...e, ...patch } });
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs(Card, { children: [_jsx(SectionTitle, { children: "Remitente" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Field, { label: "Nombre del remitente", children: _jsx(Input, { value: e.fromName, onChange: v => upd({ fromName: v }), placeholder: "V ONE B Sistema" }) }), _jsx(Field, { label: "Correo del remitente", children: _jsx(Input, { value: e.fromEmail, onChange: v => upd({ fromEmail: v }), placeholder: "no-reply@voneb.cr", type: "email" }) })] }), _jsx(Field, { label: "Correos para notificaciones", hint: "Separados por coma \u2014 reciben alertas de stock, pedidos, etc.", children: _jsx(Input, { value: e.notifyEmails, onChange: v => upd({ notifyEmails: v }), placeholder: "admin@voneb.cr, bodega@voneb.cr" }) })] })] }), _jsxs(Card, { children: [_jsx(SectionTitle, { children: "Configuraci\u00F3n SMTP" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Field, { label: "Servidor SMTP", children: _jsx(Input, { value: e.smtpHost, onChange: v => upd({ smtpHost: v }), placeholder: "smtp.gmail.com" }) }), _jsx(Field, { label: "Puerto", children: _jsx(Input, { value: e.smtpPort, onChange: v => upd({ smtpPort: v }), placeholder: "587" }) })] }), _jsxs("div", { className: "bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3 text-xs text-[#6B7280] space-y-1.5", children: [_jsx("p", { className: "font-semibold text-[#9CA3AF]", children: "Servidores comunes:" }), _jsxs("p", { children: ["\uD83D\uDCE7 ", _jsx("strong", { className: "text-white", children: "Gmail:" }), " smtp.gmail.com \u00B7 puerto 587 (requiere App Password)"] }), _jsxs("p", { children: ["\uD83D\uDCE7 ", _jsx("strong", { className: "text-white", children: "Outlook:" }), " smtp.office365.com \u00B7 puerto 587"] }), _jsxs("p", { children: ["\uD83D\uDCE7 ", _jsx("strong", { className: "text-white", children: "Dominio propio:" }), " mail.tudominio.cr \u00B7 puerto 465"] })] })] })] }), _jsxs("div", { className: "bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-xl p-4 flex items-start gap-3", children: [_jsx(Lock, { className: "w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-[#F59E0B]", children: "Si usas Gmail" }), _jsxs("p", { className: "text-xs text-[#6B7280] mt-1", children: ["Activa la verificaci\u00F3n en dos pasos y genera una ", _jsx("strong", { className: "text-[#9CA3AF]", children: "App Password" }), " espec\u00EDfica para este sistema en myaccount.google.com \u2192 Seguridad \u2192 Contrase\u00F1as de aplicaci\u00F3n."] })] })] })] }));
}
// ── Tab: Shopify ──────────────────────────────────────────────────────────────
function TabShopify({ s, set }) {
    const sh = s.shopify;
    const upd = (patch) => set({ ...s, shopify: { ...sh, ...patch } });
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: `rounded-xl p-4 flex items-start gap-3 ${sh.domain && sh.apiKey
                    ? 'bg-[#00FF88]/5 border border-[#00FF88]/20'
                    : 'bg-[#1A1A1A] border border-[#2A2A2A]'}`, children: [_jsx(ShoppingBag, { className: `w-5 h-5 flex-shrink-0 mt-0.5 ${sh.domain && sh.apiKey ? 'text-[#00FF88]' : 'text-[#4B5563]'}` }), _jsxs("div", { children: [_jsx("p", { className: `text-sm font-semibold ${sh.domain && sh.apiKey ? 'text-[#00FF88]' : 'text-[#6B7280]'}`, children: sh.domain && sh.apiKey ? `Conectado a ${sh.domain}` : 'Shopify no conectado' }), _jsx("p", { className: "text-xs text-[#6B7280] mt-1", children: "La sincronizaci\u00F3n permite que el inventario se actualice autom\u00E1ticamente cuando hay ventas en Shopify." })] })] }), _jsxs(Card, { children: [_jsx(SectionTitle, { children: "Credenciales de la tienda" }), _jsxs("div", { className: "space-y-4", children: [_jsx(Field, { label: "Dominio de Shopify", hint: "Ej: voneb.myshopify.com o tu dominio propio", children: _jsx(Input, { value: sh.domain, onChange: v => upd({ domain: v }), placeholder: "voneb.myshopify.com" }) }), _jsx(Field, { label: "API Key", hint: "En Shopify Admin \u2192 Configuraci\u00F3n \u2192 Apps \u2192 Desarrollar apps", children: _jsx(Input, { value: sh.apiKey, onChange: v => upd({ apiKey: v }), placeholder: "shpat_xxxxxxxxxxxxxxxx" }) }), _jsx(Field, { label: "API Secret Key", children: _jsx(PasswordInput, { value: sh.apiSecret, onChange: v => upd({ apiSecret: v }), placeholder: "shpss_xxxxxxxxxxxxxxxx" }) })] })] }), _jsxs(Card, { children: [_jsx(SectionTitle, { children: "Sincronizaci\u00F3n" }), _jsxs("div", { className: "space-y-4", children: [_jsx(Toggle, { enabled: sh.syncEnabled, onChange: v => upd({ syncEnabled: v }), label: "Sincronizaci\u00F3n activa", desc: "Mantiene el inventario alineado entre este sistema y Shopify" }), sh.syncEnabled && (_jsx(Field, { label: "Direcci\u00F3n de sincronizaci\u00F3n", children: _jsxs(Select, { value: sh.syncDirection, onChange: v => upd({ syncDirection: v }), children: [_jsx("option", { value: "bidirectional", children: "\u2194 Bidireccional (recomendado)" }), _jsx("option", { value: "voneb_to_shopify", children: "\u2192 Solo V ONE B \u2192 Shopify" }), _jsx("option", { value: "shopify_to_voneb", children: "\u2190 Solo Shopify \u2192 V ONE B" })] }) }))] })] }), _jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-4", children: [_jsx("p", { className: "text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3", children: "C\u00F3mo obtener las credenciales" }), [
                        'Entra a tu Shopify Admin → Configuración → Apps y canales de ventas',
                        'Haz clic en "Desarrollar apps" y crea una app nueva',
                        'En la app, ve a "Permisos de API de administración" y activa: read_inventory, write_inventory, read_products',
                        'Instala la app y copia el Access Token (API Key)',
                    ].map((step, i) => (_jsxs("div", { className: "flex items-start gap-3 mb-3 last:mb-0", children: [_jsx("span", { className: "w-5 h-5 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-xs flex items-center justify-center text-[#6B7280] flex-shrink-0 mt-0.5", children: i + 1 }), _jsx("p", { className: "text-xs text-[#9CA3AF]", children: step })] }, i)))] })] }));
}
// ── Tab: Usuarios ─────────────────────────────────────────────────────────────
function TabUsuarios({ s, set }) {
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'ventas' });
    const [adding, setAdding] = useState(false);
    const addUser = () => {
        if (!newUser.name || !newUser.email)
            return;
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
    const toggleUser = (id) => {
        set({ ...s, users: s.users.map(u => u.id === id ? { ...u, active: !u.active } : u) });
    };
    const removeUser = (id) => {
        if (s.users.length <= 1)
            return;
        set({ ...s, users: s.users.filter(u => u.id !== id) });
    };
    const changeRole = (id, role) => {
        set({ ...s, users: s.users.map(u => u.id === id ? { ...u, role } : u) });
    };
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs(Card, { children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx(SectionTitle, { children: "Usuarios del panel" }), _jsxs("button", { onClick: () => setAdding(a => !a), className: "flex items-center gap-1.5 text-xs font-semibold text-[#00FF88] hover:underline", children: [_jsx(Plus, { className: "w-3.5 h-3.5" }), " Agregar usuario"] })] }), adding && (_jsxs("div", { className: "bg-[#1A1A1A] border border-[#00FF88]/20 rounded-xl p-4 mb-4 space-y-3", children: [_jsx("p", { className: "text-xs font-semibold text-[#00FF88]", children: "Nuevo usuario" }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Input, { value: newUser.name, onChange: v => setNewUser(n => ({ ...n, name: v })), placeholder: "Nombre completo" }), _jsx(Input, { value: newUser.email, onChange: v => setNewUser(n => ({ ...n, email: v })), placeholder: "correo@voneb.cr", type: "email" })] }), _jsxs(Select, { value: newUser.role, onChange: v => setNewUser(n => ({ ...n, role: v })), children: [_jsx("option", { value: "admin", children: "Admin \u2014 Acceso total" }), _jsx("option", { value: "bodega", children: "Bodega \u2014 Solo inventario" }), _jsx("option", { value: "ventas", children: "Ventas \u2014 Pedidos y clientes" }), _jsx("option", { value: "lectura", children: "Solo lectura \u2014 Ver reportes" })] }), _jsxs("div", { className: "flex gap-2 justify-end", children: [_jsx("button", { onClick: () => setAdding(false), className: "text-xs text-[#6B7280] hover:text-white px-3 py-1.5", children: "Cancelar" }), _jsx("button", { onClick: addUser, disabled: !newUser.name || !newUser.email, className: "text-xs bg-[#00FF88] text-black font-bold px-4 py-1.5 rounded-lg disabled:opacity-40", children: "Agregar" })] })] })), _jsx("div", { className: "space-y-2", children: s.users.map(u => (_jsxs("div", { className: `flex items-center gap-3 p-3 rounded-xl border transition-colors ${u.active ? 'bg-[#111111] border-[#1E1E1E]' : 'bg-[#0F0F0F] border-[#1A1A1A] opacity-50'}`, children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center flex-shrink-0", children: _jsx("span", { className: "text-xs font-bold text-[#6B7280]", children: u.name.charAt(0).toUpperCase() }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-white truncate", children: u.name }), _jsx("p", { className: "text-xs text-[#6B7280] truncate", children: u.email })] }), _jsxs("select", { value: u.role, onChange: e => changeRole(u.id, e.target.value), className: `text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer bg-transparent ${ROLE_COLORS[u.role]}`, children: [_jsx("option", { value: "admin", children: "Admin" }), _jsx("option", { value: "bodega", children: "Bodega" }), _jsx("option", { value: "ventas", children: "Ventas" }), _jsx("option", { value: "lectura", children: "Solo lectura" })] }), _jsx("button", { onClick: () => toggleUser(u.id), className: "text-xs text-[#6B7280] hover:text-white px-2", title: u.active ? 'Desactivar' : 'Activar', children: u.active ? _jsx(Eye, { className: "w-4 h-4" }) : _jsx(EyeOff, { className: "w-4 h-4" }) }), s.users.length > 1 && (_jsx("button", { onClick: () => removeUser(u.id), className: "text-[#6B7280] hover:text-[#EF4444]", children: _jsx(Trash2, { className: "w-4 h-4" }) }))] }, u.id))) })] }), _jsxs(Card, { children: [_jsx(SectionTitle, { children: "Descripci\u00F3n de roles" }), _jsx("div", { className: "space-y-3", children: [
                            { role: 'admin', icon: '🔑', perms: 'Acceso total — puede borrar productos, cambiar precios, configurar el sistema y gestionar usuarios' },
                            { role: 'bodega', icon: '📦', perms: 'Inventario, movimientos de stock y alertas — no ve costos ni márgenes' },
                            { role: 'ventas', icon: '🛒', perms: 'Pedidos, clientes y stock disponible — no puede editar precios ni ver costos' },
                            { role: 'lectura', icon: '👁️', perms: 'Solo puede ver reportes y dashboard — sin permisos de edición' },
                        ].map(r => (_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("span", { className: `text-xs font-bold px-2 py-0.5 rounded border flex-shrink-0 mt-0.5 ${ROLE_COLORS[r.role]}`, children: ROLE_LABELS[r.role] }), _jsx("p", { className: "text-xs text-[#6B7280]", children: r.perms })] }, r.role))) })] })] }));
}
// ── Tab: Sistema ──────────────────────────────────────────────────────────────
function TabSistema({ s, set }) {
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
            const file = e.target.files?.[0];
            if (!file)
                return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target?.result);
                    set({ ...DEFAULT_SETTINGS, ...data });
                }
                catch {
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
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs(Card, { children: [_jsx(SectionTitle, { children: "Informaci\u00F3n del sistema" }), _jsx("div", { className: "space-y-2", children: [
                            { label: 'Versión del panel', value: 'v1.0.0' },
                            { label: 'Entorno', value: 'Desarrollo local' },
                            { label: 'Base de datos', value: 'Mock / LocalStorage' },
                            { label: 'Última configuración guardada', value: localStorage.getItem(STORAGE_KEY) ? 'Disponible' : 'Sin guardar aún' },
                        ].map(row => (_jsxs("div", { className: "flex items-center justify-between py-2 border-b border-[#1E1E1E] last:border-0", children: [_jsx("span", { className: "text-sm text-[#6B7280]", children: row.label }), _jsx("span", { className: "text-sm font-medium text-white", children: row.value })] }, row.label))) })] }), _jsxs(Card, { children: [_jsx(SectionTitle, { children: "Respaldo de configuraci\u00F3n" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("button", { onClick: exportConfig, className: "w-full flex items-center justify-between px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl hover:border-[#00FF88]/30 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Download, { className: "w-4 h-4 text-[#00FF88]" }), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: "text-sm font-medium text-white", children: "Exportar configuraci\u00F3n" }), _jsx("p", { className: "text-xs text-[#6B7280]", children: "Descarga un archivo .json con todos los ajustes" })] })] }), _jsx(ChevronRight, { className: "w-4 h-4 text-[#4B5563]" })] }), _jsxs("button", { onClick: importConfig, className: "w-full flex items-center justify-between px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl hover:border-[#3B82F6]/30 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Server, { className: "w-4 h-4 text-[#3B82F6]" }), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: "text-sm font-medium text-white", children: "Importar configuraci\u00F3n" }), _jsx("p", { className: "text-xs text-[#6B7280]", children: "Restaura ajustes desde un archivo .json anterior" })] })] }), _jsx(ChevronRight, { className: "w-4 h-4 text-[#4B5563]" })] })] })] }), _jsxs(Card, { children: [_jsx(SectionTitle, { children: "Zona de peligro" }), !resetConfirm ? (_jsxs("button", { onClick: () => setResetConfirm(true), className: "flex items-center gap-2 text-sm font-medium text-[#EF4444] hover:underline", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), "Restablecer configuraci\u00F3n a valores por defecto"] })) : (_jsxs("div", { className: "bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-xl p-4", children: [_jsx("p", { className: "text-sm font-semibold text-[#EF4444] mb-2", children: "\u00BFSeguro que quieres restablecer todo?" }), _jsx("p", { className: "text-xs text-[#6B7280] mb-4", children: "Esto borrar\u00E1 WhatsApp API, Shopify, correo y todos los usuarios (menos el admin principal). No se puede deshacer." }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: resetAll, className: "px-4 py-2 bg-[#EF4444] text-white text-xs font-bold rounded-lg hover:bg-[#DC2626]", children: "S\u00ED, restablecer" }), _jsx("button", { onClick: () => setResetConfirm(false), className: "px-4 py-2 text-[#6B7280] text-xs font-medium hover:text-white", children: "Cancelar" })] })] }))] })] }));
}
// ── Página principal ──────────────────────────────────────────────────────────
export function InventorySettings() {
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettingsState] = useState(loadSettings);
    const [saved, setSaved] = useState(false);
    const setSettings = (s) => {
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
    return (_jsxs("div", { className: "h-full flex flex-col bg-[#0A0A0A] overflow-hidden", children: [_jsxs("div", { className: "flex-shrink-0 border-b border-[#1E1E1E] bg-[#0A0A0A] px-5 pt-5 pb-0", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-white", children: "Configuraci\u00F3n" }), _jsx("p", { className: "text-sm text-[#6B7280] mt-0.5", children: "Ajustes del sistema de inventario V ONE B" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(SaveBadge, { saved: saved }), _jsxs("button", { onClick: handleSave, className: "flex items-center gap-2 bg-[#00FF88] text-black text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#00DD77] transition-colors", children: [_jsx(Save, { className: "w-4 h-4" }), "Guardar"] })] })] }), _jsx("div", { className: "flex gap-1 overflow-x-auto pb-0 scrollbar-none", children: TABS.map(tab => (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `flex items-center gap-2 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                                ? 'text-[#00FF88] border-[#00FF88]'
                                : 'text-[#6B7280] border-transparent hover:text-white'}`, children: [_jsx(tab.icon, { className: "w-3.5 h-3.5" }), tab.label] }, tab.id))) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-5", children: [activeTab === 'general' && _jsx(TabGeneral, { s: settings, set: setSettings }), activeTab === 'notificaciones' && _jsx(TabNotificaciones, { s: settings, set: setSettings }), activeTab === 'whatsapp' && _jsx(TabWhatsApp, { s: settings, set: setSettings }), activeTab === 'email' && _jsx(TabEmail, { s: settings, set: setSettings }), activeTab === 'shopify' && _jsx(TabShopify, { s: settings, set: setSettings }), activeTab === 'usuarios' && _jsx(TabUsuarios, { s: settings, set: setSettings }), activeTab === 'sistema' && _jsx(TabSistema, { s: settings, set: setSettings })] })] }));
}
