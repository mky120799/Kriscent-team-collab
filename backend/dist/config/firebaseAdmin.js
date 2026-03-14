// backend/src/config/firebaseAdmin.ts
import admin from "firebase-admin";
import serviceAccount from "./kriscent-collab-firebase-adminsdk-fbsvc-d3e1e533fa.json" with { type: "json" };
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
export default admin;
//# sourceMappingURL=firebaseAdmin.js.map