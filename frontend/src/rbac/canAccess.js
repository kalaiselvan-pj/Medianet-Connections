export const canAccess = (module, action = "view") => {
    try {
        const permissions = JSON.parse(localStorage.getItem("userPermissions") || "{}");

        const normalized = Object.fromEntries(
            Object.entries(permissions).map(([k, v]) => [k.toLowerCase(), v])
        );

        const modulePermissions = normalized[module.toLowerCase()];
        // Handle both formats
        if (Array.isArray(modulePermissions)) {
            const result = modulePermissions.includes(action);
            return result;
        }

        if (modulePermissions && typeof modulePermissions === 'object') {
            const result = modulePermissions[action] === true;
            return result;
        }

        return false;
    } catch (error) {
        console.error('Permission check error:', error);
        return false;
    }
};
