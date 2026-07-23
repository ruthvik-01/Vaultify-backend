import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { FileProvider } from './context/FileContext';
import AppRoutes from './routes';

export default function App() {
  return (
    <FileProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </FileProvider>
  );
}
