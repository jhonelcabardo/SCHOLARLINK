/* =========================================================
   SCHOLARLINK
   SUPABASE CONFIGURATION
   Firebase = Authentication
   Firebase = Firestore
   Supabase = Photo & Requirements Storage
========================================================= */

import {
    createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

import {
    auth
} from "./firebase.js";


/* =========================================================
   SUPABASE PROJECT
========================================================= */

const SUPABASE_URL =
    "https://nrccjbqigkewosxvuqiv.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_-No4wI_C6LomxdXh2pO1ug_Daeq0xzK";


/* =========================================================
   CREATE SUPABASE CLIENT
========================================================= */

const supabase =
    createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
            accessToken: async () => {

                const user = auth.currentUser;

                if (!user) {
                    console.warn(
                        "No Firebase user is currently signed in."
                    );

                    return null;
                }

                try {

                    const token =
                        await user.getIdToken(false);

                    return token;

                } catch (error) {

                    console.error(
                        "Failed to get Firebase ID token:",
                        error
                    );

                    return null;
                }
            }
        }
    );


/* =========================================================
   EXPORT
========================================================= */

export {
    supabase
};