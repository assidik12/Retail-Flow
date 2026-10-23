package toko_online.model.enums;

public enum Role {
    USER,
    ADMIN,
    OWNER,
    CASHIER;

    public static Role fromString(String value) {
        if (value == null)
            return CASHIER;
        String normalized = value.trim().toUpperCase();
        try {
            return Role.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            if ("ADMIN".equals(normalized) || "OWNER".equals(normalized)) {
                return OWNER;
            }
            return CASHIER;
        }
    }
}
