const Region = require("../models/Region");

const createRegion = async (req, res) => {
  try {
    const { regionName, regionCode, isActive, visibility } = req.body;

    if (!regionName || !regionCode) {
      return res
        .status(400)
        .json({ message: "Please provide region name and code" });
    }

    const regionExists = await Region.findOne({
      $or: [{ regionName }, { regionCode }],
    });

    if (regionExists) {
      return res
        .status(400)
        .json({ message: "Region with this name or code already exists" });
    }

    const region = await Region.create({
      regionName,
      regionCode,
      isActive,
      visibility,
    });

    res.status(201).json({
      success: true,
      data: region,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllRegions = async (req, res) => {
  try {
    const regions = await Region.find({});

    res.status(200).json({
      success: true,
      count: regions.length,
      data: regions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRegionById = async (req, res) => {
  try {
    const region = await Region.findById(req.params.id);

    if (!region) {
      return res.status(404).json({ message: "Region not found" });
    }

    res.status(200).json({
      success: true,
      data: region,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRegion = async (req, res) => {
  try {
    const region = await Region.findById(req.params.id);

    if (!region) {
      return res.status(404).json({ message: "Region not found" });
    }

    const updatedRegion = await Region.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: updatedRegion,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteRegion = async (req, res) => {
  try {
    const region = await Region.findById(req.params.id);

    if (!region) {
      return res.status(404).json({ message: "Region not found" });
    }

    await Region.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Region deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRegion,
  getAllRegions,
  getRegionById,
  updateRegion,
  deleteRegion,
};
