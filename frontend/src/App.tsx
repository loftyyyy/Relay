import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ChatRoomPage } from './pages/ChatRoomPage';
import { DMThreadPage } from './pages/DMThreadPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/room/:roomId" element={<ChatRoomPage />} />
        <Route path="/dm/:userId" element={<DMThreadPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
