import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useChatStore } from '@/store/chatStore';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ChatArea } from '@/components/ChatArea';
import { CustomerInfo } from '@/components/CustomerInfo';
import { OrderModal } from '@/components/OrderModal';
import { InventoryLayout } from '@/pages/inventory/InventoryLayout';
import { ProductionLayout } from '@/pages/production/ProductionLayout';
function ChatCenter({ onNavInventory, onNavProduction }) {
    const currentView = useChatStore(state => state.currentView);
    const isInfoPanelOpen = useChatStore(state => state.isInfoPanelOpen);
    const selectedConversation = useChatStore(state => state.getSelectedConversation());
    return (_jsxs("div", { className: "h-screen bg-[#0A0A0A] flex flex-col overflow-hidden", children: [_jsx(Header, { onNavInventory: onNavInventory, onNavProduction: onNavProduction }), _jsxs("div", { className: "flex-1 flex overflow-hidden", children: [_jsx("div", { className: `
          ${currentView === 'list' ? 'flex' : 'hidden'}
          lg:flex w-full lg:w-80 xl:w-96 flex-shrink-0
        `, children: _jsx(Sidebar, {}) }), _jsx("div", { className: `
          ${currentView === 'chat' ? 'flex' : 'hidden'}
          lg:flex flex-1 min-w-0
        `, children: _jsx(ChatArea, {}) }), isInfoPanelOpen && selectedConversation && (_jsx("div", { className: `
            ${currentView === 'info' ? 'flex' : 'hidden'}
            lg:flex w-full lg:w-72 xl:w-80 flex-shrink-0
          `, children: _jsx(CustomerInfo, {}) }))] }), _jsx(OrderModal, {})] }));
}
function App() {
    const [section, setSection] = useState('chat');
    if (section === 'inventory') {
        return _jsx(InventoryLayout, { onBack: () => setSection('chat') });
    }
    if (section === 'production') {
        return _jsx(ProductionLayout, { onBack: () => setSection('chat') });
    }
    return (_jsx(ChatCenter, { onNavInventory: () => setSection('inventory'), onNavProduction: () => setSection('production') }));
}
export default App;
