-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('admin', 'Full system administrator access'),
    ('user', 'Standard user access'),
    ('moderator', 'Moderation capabilities');

-- Insert default permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('users:read', 'users', 'read', 'View user information'),
    ('users:write', 'users', 'write', 'Create and update users'),
    ('users:delete', 'users', 'delete', 'Delete users'),
    ('roles:read', 'roles', 'read', 'View roles'),
    ('roles:write', 'roles', 'write', 'Create and update roles'),
    ('roles:delete', 'roles', 'delete', 'Delete roles'),
    ('permissions:read', 'permissions', 'read', 'View permissions'),
    ('system:admin', 'system', 'admin', 'Full system administration');

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'; -- Admin gets all permissions

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'user' AND p.name IN ('users:read');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'moderator' AND p.name IN ('users:read', 'users:write', 'roles:read');
