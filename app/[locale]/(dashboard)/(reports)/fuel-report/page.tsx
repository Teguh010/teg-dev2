"use client";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import LayoutLoader from "@/components/layout-loader";
import loadHereMaps from "@/components/maps/here-map/utils/here-map-loader";
import TopComponents from "./components/header-fuel";
import FooterMapFuel from "./components/footer-map-fuel";
import { useUser } from "@/context/UserContext";
import { relogin } from "@/lib/auth";
import { AppDispatch } from "@/redux/store";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  fetchDataObjectFuelLevel,
  fetchDataObjectTrajectory,
  fetchDataObjectList,
} from "@/redux/features/fuel-report";
import { Label } from "@radix-ui/react-label";
import { firstUpperLetter } from "@/lib/utils";

const FuelMap = dynamic(() => import("./components/fuel-map"), { ssr: false });

const Home = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { getUserRef } = UserContext.operations;
  const [mapLoaded, setMapLoaded] = useState(false);
  const [trajectoryData, setTrajectoryData] = useState([]);
  const hereMapRef = useRef(null);
  const dataContentCardRef = useRef(null);
  const [showFooterHistory, setShowFooterHistory] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const userToken = getUserRef().token;
  const dispatch = useDispatch<AppDispatch>();
  const { isPageLoading, isLoadingVehicles, vehiclesToMap, searchQuery } =
    useSelector((state: RootState) => state.maps);

  const {
    startDate,
    endDate,
    isGenerate,
    dataObjectFuelLevel,
    dataObjectTrajectory,
    vehicle,
  } = useSelector((state: RootState) => state.fuel);

  useEffect(() => {
    if (userToken) {
      dispatch(fetchDataObjectList(userToken));
    }
  }, [dispatch, userToken]);

  useEffect(() => {
    setShowFooterHistory(true);
  }, []);

  const handlePointClick = (fuelData: any) => {
    if (!dataObjectTrajectory) {
      console.error("No valid trajectory data in store");
      return;
    }
    const fuelTime = new Date(fuelData.t).getTime();
    let closestPoint = null;
    let smallestDiff = Infinity;

    dataObjectTrajectory.forEach((point) => {
      const trajectoryDate = new Date(point.time.replace(" ", "T"));
      const trajectoryTime = trajectoryDate.getTime();
      const timeDiff = Math.abs(fuelTime - trajectoryTime);

      if (timeDiff < smallestDiff) {
        smallestDiff = timeDiff;
        closestPoint = point;
      }
    });

    if (closestPoint) {
      const localTime = new Date(closestPoint.time.replace(" ", "T"));

      const matchedData = {
        lat: closestPoint.lat,
        lon: closestPoint.lon || closestPoint.lng,
        time: localTime.toLocaleString("sv").replace(" ", "T"),
        fuelLevel: fuelData.p,
      };
      setSelectedLocation(matchedData);
    }
  };

  const handleGenerateClick = async () => {
    if (vehicle && startDate && endDate) {
      try {
        await dispatch(
          fetchDataObjectTrajectory(userToken, vehicle, startDate, endDate)
        );
        await dispatch(
          fetchDataObjectFuelLevel(userToken, vehicle, startDate, endDate)
        );
      } catch (error) {
        if (error?.error?.data?.message === "Signature has expired") {
          try {
            const newToken = await relogin();
            if (newToken) {
              // Retry the requests with new token
              await dispatch(
                fetchDataObjectTrajectory(newToken, vehicle, startDate, endDate)
              );
              await dispatch(
                fetchDataObjectFuelLevel(newToken, vehicle, startDate, endDate)
              );
            } else {
              window.location.assign("/");
            }
          } catch (reloginError) {
            console.error("Relogin failed:", reloginError);
            window.location.assign("/");
          }
        } else {
          console.error("Error generating data:", error);
        }
      }
    }
  };

  useEffect(() => {
    if (dataObjectTrajectory) {
      const trajectoryData = dataObjectTrajectory.map((track) => ({
        lat: track.lat,
        lng: track.lon,
        ...track,
      }));
      setTrajectoryData(trajectoryData);
    }
  }, [dataObjectTrajectory]);

  useEffect(() => {
    loadHereMaps(() => {
      setMapLoaded(true);
    });
  }, []);

  if (isLoadingVehicles || !vehiclesToMap || !mapLoaded) {
    return <LayoutLoader />;
  }

  const renderMap = () => {
    return vehicle ? (
      <FuelMap
        ref={hereMapRef}
        lat={vehicle.lat}
        lon={vehicle.lon}
        zoom={15}
        trajectoryData={trajectoryData}
        selectedLocation={selectedLocation}
      />
    ) : (
      <FuelMap
        ref={hereMapRef}
        lat={56.31226}
        lon={22.3230616}
        zoom={15}
        trajectoryData={trajectoryData}
        selectedLocation={selectedLocation}
      />
    );
  };

  const toggleFooter = () => {
    setShowFooterHistory((prev) => !prev);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="col-span-12 lg:col-span-12 overflow-x-auto">
        <Label className="font-normal">
          {firstUpperLetter(t("general.fuel_report"))}
        </Label>
      </div>
      <div className="pb-4">
        <TopComponents
          vehicleHistoryMap={vehicle}
          isGenerate={isGenerate}
          handleGenerateClick={handleGenerateClick}
        />
      </div>
      <div className="flex-grow p-0">{renderMap()}</div>

      <div className="bg-gray-800 text-white p-0">
        <Card
          ref={dataContentCardRef}
          className="data-content-card p-0 bg-white w-full rounded-none shadow-none"
        >
          <CardContent className="px-0 pt-0 pb-0">
            <div
              className={`text-center flex justify-center items-center w-full`}
              style={{ minHeight: "30vh", height: "38vh" }}
            >
              {dataObjectTrajectory && dataObjectTrajectory.length > 0 ? (
                <FooterMapFuel
                  dataObjectFuelLevel={dataObjectFuelLevel}
                  onPointClick={handlePointClick}
                />
              ) : (
                <div className="text-gray-500"> No Data Available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
