import React from 'react';
import AuthForm from './AuthForm';

interface AuthScreenProps {
  onClose?: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001] p-4">
      <AuthForm onClose={onClose} />
    </div>
  );
};

export default AuthScreen;
