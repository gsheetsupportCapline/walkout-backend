const Office = require("../models/Office");

const createOffice = async (req, res) => {
  try {
    const { officeName, regionId, isActive, visibility } = req.body;

    if (!officeName || !regionId) {
      return res
        .status(400)
        .json({ message: "Please provide office name and region" });
    }

    const office = await Office.create({
      officeName,
      regionId,
      isActive,
      visibility,
    });

    const populatedOffice = await Office.findById(office._id).populate(
      "regionId",
      "regionName"
    );

    res.status(201).json({
      success: true,
      data: populatedOffice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllOffices = async (req, res) => {
  try {
    const offices = await Office.find({}).populate("regionId", "regionName");

    res.status(200).json({
      success: true,
      count: offices.length,
      data: offices,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOfficeById = async (req, res) => {
  try {
    const office = await Office.findById(req.params.id).populate(
      "regionId",
      "regionName"
    );

    if (!office) {
      return res.status(404).json({ message: "Office not found" });
    }

    res.status(200).json({
      success: true,
      data: office,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOffice = async (req, res) => {
  try {
    const office = await Office.findById(req.params.id);

    if (!office) {
      return res.status(404).json({ message: "Office not found" });
    }

    const updatedOffice = await Office.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("regionId", "regionName");

    res.status(200).json({
      success: true,
      data: updatedOffice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteOffice = async (req, res) => {
  try {
    const office = await Office.findById(req.params.id);

    if (!office) {
      return res.status(404).json({ message: "Office not found" });
    }

    await Office.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Office deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOffice,
  getAllOffices,
  getOfficeById,
  updateOffice,
  deleteOffice,
};
