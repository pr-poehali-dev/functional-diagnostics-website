import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/AuthForm';
import AppHeader from '@/components/AppHeader';
import MainTabs from '@/components/MainTabs';
import QuickInputModal from '@/components/QuickInputModal';
import { FieldOrderSettings } from '@/components/FieldOrderSettings';
import { useProtocolManager } from '@/hooks/useProtocolManager';
import { useProtocolExporter } from '@/components/ProtocolExporter';
import { toast } from 'sonner';

const Index = () => {
  const { doctor, isLoading: authLoading, logout } = useAuth();
  const [isFieldOrderOpen, setIsFieldOrderOpen] = useState(false);

  const {
    selectedStudy,
    setSelectedStudy,
    patientData,
    parameters,
    setParameters,
    protocols,
    protocolsLoading,
    fetchProtocols,
    updateProtocol,
    deleteProtocol,
    importProtocols,
    activeTab,
    setActiveTab,
    isQuickInputOpen,
    setIsQuickInputOpen,
    fieldOrder,
    setFieldOrder,
    handlePatientDataChange,
    handleParameterChange,
    handleQuickInputSave,
    openQuickInput,
    getParameterStatus,
    generateConclusion,
    handleGenerateProtocol,
    saveFieldOrder,
    loadFieldOrder,
  } = useProtocolManager(doctor?.email || null);

  const { exportToPDF, printProtocol } = useProtocolExporter({
    doctor,
    getParameterStatus,
  });

  const handleOpenFieldOrderSettings = () => {
    if (!selectedStudy) {
      toast.error('Сначала выберите тип исследования');
      return;
    }
    const currentOrder = loadFieldOrder(selectedStudy.id);
    const order = currentOrder.length > 0 ? currentOrder : selectedStudy.parameters.map(p => p.id);
    setFieldOrder(order);
    setIsFieldOrderOpen(true);
  };

  const handleSaveFieldOrder = (order: string[]) => {
    if (selectedStudy) {
      saveFieldOrder(selectedStudy.id, order);
      setFieldOrder(order);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!doctor) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <AppHeader doctor={doctor} onLogout={logout} />

      <main className="container mx-auto px-4 py-8">
        <MainTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedStudy={selectedStudy}
          setSelectedStudy={setSelectedStudy}
          patientData={patientData}
          handlePatientDataChange={handlePatientDataChange}
          parameters={parameters}
          setParameters={setParameters}
          handleParameterChange={handleParameterChange}
          openQuickInput={openQuickInput}
          getParameterStatus={getParameterStatus}
          generateConclusion={generateConclusion}
          handleGenerateProtocol={handleGenerateProtocol}
          protocols={protocols}
          protocolsLoading={protocolsLoading}
          fetchProtocols={fetchProtocols}
          updateProtocol={updateProtocol}
          deleteProtocol={deleteProtocol}
          importProtocols={importProtocols}
          exportToPDF={exportToPDF}
          printProtocol={printProtocol}
          onOpenFieldOrderSettings={handleOpenFieldOrderSettings}
        />
      </main>

      {selectedStudy && (
        <>
          <QuickInputModal
            isOpen={isQuickInputOpen}
            onClose={() => setIsQuickInputOpen(false)}
            parameters={selectedStudy.parameters}
            fieldOrder={fieldOrder}
            values={parameters}
            onSave={handleQuickInputSave}
          />
          
          <FieldOrderSettings
            isOpen={isFieldOrderOpen}
            onClose={() => setIsFieldOrderOpen(false)}
            parameters={selectedStudy.parameters}
            currentOrder={fieldOrder}
            onSave={handleSaveFieldOrder}
          />
        </>
      )}
    </div>
  );
};

export default Index;