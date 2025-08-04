import journal from "./meta/_journal.json";
import m0000 from "./0000_melted_ronan.sql";
import m0001 from "./0001_tricky_hawkeye.sql";
import m0002 from "./0002_peaceful_hannibal_king.sql";

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
  },
};
