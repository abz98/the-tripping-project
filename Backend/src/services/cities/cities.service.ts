/**
 * City Service
 */

import { City } from "../../models/cities/cities.model.js";
import { CityValidationError } from "./cities.errors.js";

export interface CityResponse {
  City: string;
  State: string;
  District: string;
}

export interface SearchCitiesResult {
  cities: CityResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function toCityResponse(city: any): CityResponse {
  return {
    City: city.City,
    State: city.State,
    District: city.District,
  };
}

export const cityService = {
  async searchByDistrict(
    districtQuery: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<SearchCitiesResult> {
    if (!districtQuery || !districtQuery.trim()) {
      throw new CityValidationError("District search query is required", {
        district: "District search query cannot be empty",
      });
    }

    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 50;

    const skip = (page - 1) * limit;

    // Case-insensitive regex search
    const regex = new RegExp(districtQuery.trim(), "i");

    const [cities, total] = await Promise.all([
      City.find({ District: regex })
        .select("City State District -_id")
        .sort({ State: 1, District: 1, City: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      City.countDocuments({ District: regex }),
    ]);

    return {
      cities: cities.map(toCityResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async searchByCity(
    cityQuery: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<SearchCitiesResult> {
    if (!cityQuery || !cityQuery.trim()) {
      throw new CityValidationError("City search query is required", {
        city: "City search query cannot be empty",
      });
    }

    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 50;

    const skip = (page - 1) * limit;

    // Case-insensitive regex search
    const regex = new RegExp(cityQuery.trim(), "i");

    const [cities, total] = await Promise.all([
      City.find({ City: regex })
        .select("City State District -_id")
        .sort({ State: 1, District: 1, City: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      City.countDocuments({ City: regex }),
    ]);

    return {
      cities: cities.map(toCityResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async searchByState(
    stateQuery: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<SearchCitiesResult> {
    if (!stateQuery || !stateQuery.trim()) {
      throw new CityValidationError("State search query is required", {
        state: "State search query cannot be empty",
      });
    }

    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 50;

    const skip = (page - 1) * limit;

    // Case-insensitive regex search
    const regex = new RegExp(stateQuery.trim(), "i");

    const [cities, total] = await Promise.all([
      City.find({ State: regex })
        .select("City State District -_id")
        .sort({ State: 1, District: 1, City: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      City.countDocuments({ State: regex }),
    ]);

    return {
      cities: cities.map(toCityResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getStates(): Promise<string[]> {
    const states = await City.distinct("State");
    return states.sort();
  },

  async getDistrictsByState(state: string): Promise<string[]> {
    if (!state || !state.trim()) {
      throw new CityValidationError("State is required", {
        state: "State cannot be empty",
      });
    }

    const districts = await City.distinct("District", {
      State: { $regex: new RegExp(`^${state.trim()}$`, "i") },
    });
    return districts.sort();
  },
};

export default cityService;
