import { useAppStore } from './store/appStore';
import { FileManager } from './components/FileManager/FileManager';
import { DataViewer } from './components/DataViewer/DataViewer';
import { Header } from './components/UI/Header';
import { Sidebar } from './components/UI/Sidebar';

function App() {
  const { ui, files } = useAppStore();

  return (
    <div className={`h-screen flex flex-col ${ui.theme === 'dark' ? 'dark' : ''}`}>
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <main className={`flex-1 flex flex-col transition-all duration-300 ${
          ui.sidebarOpen ? 'ml-64' : 'ml-0'
        }`}>
          {files.loaded.length === 0 ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <div className="text-6xl mb-4">📁</div>
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Welcome to Record Explorer
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Load JSON files to start exploring your data
                </p>
                <FileManager />
              </div>
            </div>
          ) : (
            <DataViewer />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
