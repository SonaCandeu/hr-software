// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { EmployeeDetailsPage } from './pages/EmployeeDetailsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/employees/:id" element={<EmployeeDetailsPage />} />
      </Routes>
    </BrowserRouter>
  );
}