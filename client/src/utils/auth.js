// src/utils/auth.js
import { Alert } from "react-bootstrap";
// src/utils/auth.js
export const checkAccess = (allowedRoles) => {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  return user.role && allowedRoles.includes(user.role);
};

export const AccessDeniedAlert = () => (
  <div className="content-body">
    <Alert variant="danger" className="mb-4">
      Error: Access denied, admin only
    </Alert>
  </div>
);
