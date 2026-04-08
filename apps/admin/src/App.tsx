import { useState } from 'react';
import { useChatStore } from '@/store/chatStore';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ChatArea } from '@/components/ChatArea';
import { CustomerInfo } from '@/components/CustomerInfo';
import { OrderModal } from '@/components/OrderModal';
import { InventoryLayout } from '@/pages/inventory/InventoryLayout';
import { ProductionLayout } from '@/pages/production/ProductionLayout';

type AppSection = 'chat' | 'inventory' | 'production';

function ChatCenter({ onNavInventory, onNavProduction }: { onNavInventory: () => void; onNavProduction: () => void }) {
  const currentView = useChatStore(state => state.currentView);
  const isInfoPanelOpen = useChatStore(state => state.isInfoPanelOpen);
  const selectedConversation = useChatStore(state => state.getSelectedConversation());

  return (
    <div className="h-screen bg-[#0A0A0A] flex flex-col overflow-hidden">
      <Header onNavInventory={onNavInventory} onNavProduction={onNavProduction} />
      <div className="flex-1 flex overflow-hidden">
        <div className={`
          ${currentView === 'list' ? 'flex' : 'hidden'}
          lg:flex w-full lg:w-80 xl:w-96 flex-shrink-0
        `}>
          <Sidebar />
        </div>
        <div className={`
          ${currentView === 'chat' ? 'flex' : 'hidden'}
          lg:flex flex-1 min-w-0
        `}>
          <ChatArea />
        </div>
        {isInfoPanelOpen && selectedConversation && (
          <div className={`
            ${currentView === 'info' ? 'flex' : 'hidden'}
            lg:flex w-full lg:w-72 xl:w-80 flex-shrink-0
          `}>
            <CustomerInfo />
          </div>
        )}
      </div>
      <OrderModal />
    </div>
  );
}

function App() {
  const [section, setSection] = useState<AppSection>('chat');

  if (section === 'inventory') {
    return <InventoryLayout onBack={() => setSection('chat')} />;
  }

  if (section === 'production') {
    return <ProductionLayout onBack={() => setSection('chat')} />;
  }

  return (
    <ChatCenter
      onNavInventory={() => setSection('inventory')}
      onNavProduction={() => setSection('production')}
    />
  );
}

export default App;
