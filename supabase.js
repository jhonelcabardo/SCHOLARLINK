/* =========================================================
   SCHOLARLINK
   SUPABASE CONFIGURATION
========================================================= */

import {
    createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


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
        SUPABASE_KEY
    );


/* =========================================================
   EXPORT
========================================================= */

export {
    supabase
};











