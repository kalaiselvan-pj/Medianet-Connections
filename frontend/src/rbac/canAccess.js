
/**
 * Check if the user has permission for a module and action (view/edit)
 * @param {string} module - name of the module, e.g., 'dashboard'
 * @param {string} action - 'view' or 'edit', defaults to 'view'
 * @returns {boolean} true if allowed, false otherwise
 */
export const canAccess = (module, action = "view") => {
    const permissions = JSON.parse(localStorage.getItem("userPermissions") || "{}");

    // convert keys to lowercase
    const normalized = Object.fromEntries(
        Object.entries(permissions).map(([k, v]) => [k.toLowerCase(), v])
    );

    return normalized[module.toLowerCase()]?.[action] || false;
};
