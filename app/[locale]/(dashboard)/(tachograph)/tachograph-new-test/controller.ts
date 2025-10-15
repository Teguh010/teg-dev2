"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import {
  cleanObjectsColumns,
  firstUpperLetter,
  reorderObject,
  translateObjects,
} from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { tachoGetAuthToken, tachoGetVehicleList } from "@/models/tachograph";
import toast from "react-hot-toast";

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user, settings } = UserContext.models;
  const { getUserRef } = UserContext.operations;
  const [isLoading, setLoading] = useState(true);
  const [, setUnitDistance] = useState(
    settings.find((setting) => setting.title === "unit_distance")?.value
  );
  const [, setUnitVolume] = useState(
    settings.find((setting) => setting.title === "unit_volume")?.value
  );
  const [, /* dateFormat */ setDateFormat] = useState(
    settings.find((setting) => setting.title === "date_format")?.value
  );
  const [, /* timeFormat */ setTimeFormat] = useState(
    settings.find((setting) => setting.title === "time_format")?.value
  );
  const [dataTachoDriverCardFilesList, setDataTachoDriverCardFilesList] =
    useState([]);

  /* const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null); */
  const [isGenerate, setGenerate] = useState(false);
  const [orderListData] = useState([]);
  const [dataList, setDataList] = useState([]);
  const [ignoreList] = useState([
    { title: t("md5_hash") },
    { title: t("data_size") },
    { title: t("id") },
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterData = (objects: any[]) => {
    return objects.map((obj) => {
      const newObj = { ...obj };

      /* if (newObj.time_read) {
        const time = format(newObj.time_read, `${dateFormat} ${timeFormat}`);
        newObj.time_read = time;
      }
      if (newObj.period_to) {
        const time = format(newObj.period_to, `${dateFormat} ${timeFormat}`);
        newObj.period_to = time;
      }
      if (newObj.period_from) {
        const time = format(newObj.period_from, `${dateFormat} ${timeFormat}`);
        newObj.period_from = time;
      }
      if (newObj.data_timestamp) {
        const time = format(
          newObj.data_timestamp,
          `${dateFormat} ${timeFormat}`
        );
        newObj.data_timestamp = time;
      } */

      return reorderObject(newObj, orderListData);
    });
  };

  useEffect(() => {
    settings.forEach((setting) => {
      switch (setting.title) {
        case "time_format":
          setTimeFormat(setting.value);
          break;
        case "unit_distance":
          setUnitDistance(setting.value);
          break;
        case "unit_volume":
          setUnitVolume(setting.value);
          break;
        case "date_format":
          setDateFormat(setting.value);
          break;
      }
    });

    if (!user.token) return;

    const fetchData = async () => {
      toast.success(firstUpperLetter(t("general.processing")));
      const users = [
        {
          name: "johngadderudtransport",
          login: "lunder",
          pass: "dfs425rwee",
          customer_name: "14",
        },
        {
          name: "Romerike Bilberging AS",
          login: "RomerikeBilbergingAS",
          pass: "sdf33errff3",
          customer_name: "28",
        },
        {
          name: "jakola",
          login: "jakola",
          pass: "juukfgiy6574",
          customer_name: "12",
        },
        {
          name: "Hakkebakkeskogen Naturbarnehage",
          login: "hakkebake",
          pass: "hakkeFbake23321",
          customer_name: "51",
        },
        {
          name: "Rørvik Blomster",
          login: "Blomster",
          pass: "d3423qe3413",
          customer_name: "21",
        },
        {
          name: "KBE Maskinutleie",
          login: "KBE Maskinutleie",
          pass: "21431qasr13",
          customer_name: "25",
        },
        {
          name: "Tigre Norpukk AS",
          login: "tygre",
          pass: "1wq1131wq",
          customer_name: "23",
        },
        {
          name: "Ramlos",
          login: "ramlos",
          pass: "ds435ramslo",
          customer_name: "37",
        },
        {
          name: "Furuseth",
          login: "furuseth3",
          pass: "fdgfdgfd43e4",
          customer_name: "33",
        },
        {
          name: "johndeereforestry",
          login: "johnderekongsvinger",
          pass: "1343qdef42",
          customer_name: "30",
        },
        {
          name: "Torp Transport",
          login: "torptransport",
          pass: "321131@33wea3",
          customer_name: "35",
        },
        {
          name: "obosblockwatne",
          login: "obosblockwatne",
          pass: "sdafe53S#2",
          customer_name: "52",
        },
        {
          name: "Jahr Maskin AS",
          login: "Jahrtransportas",
          pass: "esdq112@we",
          customer_name: "36",
        },
        {
          name: "mbdeimantera",
          login: "deimantera",
          pass: "sdsf1454WW",
          customer_name: "58",
        },
        {
          name: "kimsteinsholt",
          login: "kimsteinsholt",
          pass: "sd@#34we22",
          customer_name: "56",
        },
        {
          name: "sorbyutleie",
          login: "sorbyutleie",
          pass: "W@3rdesW23",
          customer_name: "38",
        },
        {
          name: "anleggsgruppen",
          login: "qnleggsgruppen",
          pass: "asd!3e2eer",
          customer_name: "53",
        },
        {
          name: "tommygs",
          login: "Tommygs",
          pass: "DW232w4we",
          customer_name: "48",
        },
        {
          name: "arontransport",
          login: "arontransport",
          pass: "xswqd4342e",
          customer_name: "29",
        },
        {
          name: "monabetongas",
          login: "monabetong",
          pass: "q41e35ere",
          customer_name: "41",
        },
        {
          name: "Næss Anlegg og Utemiljø AS DELETE!",
          login: "NaessAnlegg",
          pass: "afqe3141",
          customer_name: "26",
        },
        {
          name: "tollersrud",
          login: "tollersrud",
          pass: "r3342$@$@23W",
          customer_name: "50",
        },
        {
          name: "John Bjørknes",
          login: "johnBjorkness",
          pass: "dsf14WR43",
          customer_name: "42",
        },
        {
          name: "hamargraveserviceas",
          login: "hamargraveserviceas",
          pass: "aeqd3435q",
          customer_name: "59",
        },
        {
          name: "otf-anlegg",
          login: "oftanleg",
          pass: "asQW@#34w",
          customer_name: "54",
        },
        {
          name: "SAR",
          login: "Sartacho",
          pass: "gy4549b1",
          customer_name: "6",
        },
        {
          name: "fossenseftfas",
          login: "fosseneseftfas",
          pass: "sr313reqs",
          customer_name: "40",
        },
        {
          name: "grondalenas",
          login: "customer294",
          pass: "q31erdf23451",
          customer_name: "44",
        },
        {
          name: "makestad",
          login: "makestad",
          pass: "dwd3432rde",
          customer_name: "9",
        },
        {
          name: "mortennyberg",
          login: "mortennyberg",
          pass: "msadaksc23",
          customer_name: "15",
        },
        {
          name: "sverenilsentransport",
          login: "customer124",
          pass: "asfwerre",
          customer_name: "47",
        },
        {
          name: "janerikanerud",
          login: "janerikanerud",
          pass: "23We344ewt4",
          customer_name: "18",
        },
        {
          name: "roisetransport",
          login: "roisetransporttacho2",
          pass: "Roise321Tacho2",
          customer_name: "E:1003",
        },
        {
          name: "lovaasmaskin_delete",
          login: "customer204",
          pass: "1dr21144ew2",
          customer_name: "45",
        },
        {
          name: "keller_Delete",
          login: "kelertacho",
          pass: "2re411swdqw",
          customer_name: "11",
        },
        {
          name: "Star Transport AS",
          login: "startransport",
          pass: "StarF321we@",
          customer_name: "39",
        },
        {
          name: "brodreneselvik",
          login: "brodneselvik",
          pass: "wqe31111w",
          customer_name: "13",
        },
        {
          name: "nilsolavhoiseteh",
          login: "dsdg421",
          pass: "234erwrt45",
          customer_name: "46",
        },
        {
          name: "2 VTG Stock",
          login: "furuseth",
          pass: "sdfew21rg",
          customer_name: "32",
        },
        {
          name: "gjersing",
          login: "gjersing3",
          pass: "dsfsr424",
          customer_name: "10",
        },
        {
          name: "tracegrid",
          login: "er2132312",
          pass: "21434qewr",
          customer_name: "56253AC182DBCDD84E2B072985C8304B615A2D61",
        },
        {
          name: "langdalen",
          login: "customer60",
          pass: "klanw20138",
          customer_name: "55",
        },
        {
          name: "citma",
          login: "citma",
          pass: "w33W@32we",
          customer_name: "49",
        },
        {
          name: "vazelina",
          login: "as1413wew",
          pass: "21we141",
          customer_name: "55FD03D73D9E9F7DD3D2ACF107AA75460182302D",
        },
        {
          name: "instituttforenergiteknikk",
          login: "customer297",
          pass: "dda2ds1423e4rfd",
          customer_name: "3E67D751E6C6B20DF0BCB8ECC19B3C99E0A6663F",
        },
        {
          name: "norfreshas_delete",
          login: "norfresh",
          pass: "14rqdef13",
          customer_name: "57E1B8714608127158DA623D298ED41D08A8A0F3",
        },
        {
          name: "test",
          login: "test",
          pass: "fsdfs6184ggf",
          customer_name: "19",
        },
        {
          name: "bjerkelia",
          login: "bjerkelia",
          pass: "342W34352er",
          customer_name: "17",
        },
        {
          name: "vilneda",
          login: "customer277_1",
          pass: "wqrr33dsf",
          customer_name: "E5070E59B1ACEFCDE61DC44C3C61446F4F95E5EB",
        },
        {
          name: "KRISTENSEN TAXI DRIFT",
          login: "taxidrift",
          pass: "sfw4wrwffw",
          customer_name: "57",
        },
        {
          name: "kjetilholthtransportas_Delete",
          login: "customer224",
          pass: "admin",
          customer_name: "555E22DE44AC5941075DC478F9815E905AD333F4",
        },
        {
          name: "Rolf Doli AS",
          login: "RolfDoli",
          pass: "213wqesrf341",
          customer_name: "22",
        },
        {
          name: "glor",
          login: "glortacho2",
          pass: "tjhtfd5575",
          customer_name: "16",
        },
        {
          name: "durictransport",
          login: "duric",
          pass: "safae45fs",
          customer_name: "34",
        },
        {
          name: "instek",
          login: "instek_test",
          pass: "323efd424r",
          customer_name: "27",
        },
      ];
      const dataList: any[] = [];

      try {
        const results = await Promise.all(
          users.map(async (u) => {
            if (!u.name || !u.login || !u.pass || !u.customer_name) {
              return null;
            }
            try {
              const auth = await tachoGetAuthToken(u.login, u.pass);
              const tokenValue = auth?.TokenValue;
              if (!tokenValue) {
                return null;
              }

              const vehicles = await tachoGetVehicleList(tokenValue, {
                only_active_vehicles: false,
              });

              if (Array.isArray(vehicles)) {
                dataList.push(...vehicles);
              } else if (vehicles) {
                dataList.push(vehicles);
              }

              return { ...u, token: tokenValue, vehicles };
            } catch (err) {
              console.error(`Error procesando ${u.login}:`, err);
              return null;
            }
          })
        );

        const filtered = filterData(dataList);
        const translated = translateObjects(filtered, t, [
          "driver_first_activity",
          "driver_last_activity",
          "birth_date",
          "card_expiry_date",
        ]);
        setDataList(translated);
      } catch (err) {
        toast.error(firstUpperLetter(t("general.process_error")));
        console.error("Error fetching client info:", err);
      } finally {
        toast.success(firstUpperLetter(t("general.process_completed")));
        setGenerate(false);
        setLoading(false);
      }
    };

    fetchData();
  }, [settings, user.token, isGenerate]);

  return {
    models: {
      user,
      settings,
      isLoading,
      dataList,
      ignoreList,
      isGenerate,
      /* startDate,
      endDate, */
    },
    operations: {
      /* setStartDate,
      setEndDate, */
      setGenerate,
    },
  };
};
