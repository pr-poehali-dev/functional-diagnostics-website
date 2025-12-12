import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/AuthForm';
import AppHeader from '@/components/AppHeader';
import MainTabs from '@/components/MainTabs';
import QuickInputModal from '@/components/QuickInputModal';
import { useProtocolManager } from '@/hooks/useProtocolManager';
import { useProtocolExporter } from '@/components/ProtocolExporter';

const Index = () => {
  const { doctor, isLoading: authLoading, logout } = useAuth();

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
    handlePatientDataChange,
    handleParameterChange,
    handleQuickInputSave,
    openQuickInput,
    getParameterStatus,
    generateConclusion,
    handleGenerateProtocol,
  } = useProtocolManager(doctor?.email || null);

  const { exportToPDF, printProtocol } = useProtocolExporter({
    doctor,
    getParameterStatus,
  });

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
        />
      </main>

      {selectedStudy && (
        <QuickInputModal
          isOpen={isQuickInputOpen}
          onClose={() => setIsQuickInputOpen(false)}
          parameters={selectedStudy.parameters}
          fieldOrder={fieldOrder}
          values={parameters}
          onSave={handleQuickInputSave}
        />
      )}
    </div>
  );
};

export default Index;