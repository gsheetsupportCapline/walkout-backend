const Team = require("../models/Team");

const createTeam = async (req, res) => {
  try {
    const { teamName, teamPermissions, isActive, visibility } = req.body;

    if (!teamName) {
      return res.status(400).json({ message: "Please provide team name" });
    }

    const teamExists = await Team.findOne({ teamName });

    if (teamExists) {
      return res.status(400).json({ message: "Team already exists" });
    }

    const team = await Team.create({
      teamName,
      teamPermissions,
      isActive,
      visibility,
    });

    res.status(201).json({
      success: true,
      data: team,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find({});

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.status(200).json({
      success: true,
      data: team,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const updatedTeam = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: updatedTeam,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    await Team.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
};
