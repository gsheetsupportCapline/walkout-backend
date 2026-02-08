const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { toCSTDateString } = require("../utils/timezone");

// Allowed email domains for signup
const ALLOWED_EMAIL_DOMAINS = [
  "winniefamilydental.com",
  "rockdaledental.com",
  "riverwalkdentalpotranco.com",
  "stellardentaltx.com",
  "mathisfamilydental.com",
  "riverwalkdentaldevine.com",
  "aransasdental.com",
  "jasperfamilydental.com",
  "calallendental.com",
  "grangerlanddental.com",
  "westgreenfamilydental.com",
  "springtownsmilestx.com",
  "lavacadental.com",
  "libertyfamilydental.com",
  "riverwalkdentalorthodontics.com",
  "huffmansmilesdental.com",
  "splendorafamilydental.com",
  "sintondental.com",
  "crosbyfamilydental.com",
  "lytledental.com",
  "caplineservices.com",
  "smilepoint.us",
  "smilepointdental.com",
  "benbrookfamilydental.com",
  "smilepointdentalnm.com",
  "sterlingsmilesazle.com",
  "smilepointdentalcare.com",
  "smilepointdentalvictoria.com",
  "caplinedentalservices.com",
];

const signup = async (req, res) => {
  try {
    const { name, email, username, password, teamName, assignedOffice, role } =
      req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({
        message: "Please provide name, email, username and password",
      });
    }

    // Validate email domain
    const emailDomain = email.split("@")[1]?.toLowerCase();
    if (!emailDomain || !ALLOWED_EMAIL_DOMAINS.includes(emailDomain)) {
      return res.status(403).json({
        message: `The domain '${emailDomain || "unknown"}' is not allowed for signup. Please use an authorized email domain.`,
      });
    }

    const userExists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (userExists) {
      return res
        .status(400)
        .json({ message: "User with this email or username already exists" });
    }

    const user = await User.create({
      name,
      email,
      username,
      password,
      role: role || "user",
      teamName,
      assignedOffice,
      isActive: false,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully. Waiting for admin approval.",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        signedUpOn: user.signedUpOn,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email/username and password" });
    }

    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    })
      .select("+password")
      .populate("teamName.teamId", "teamName teamPermissions")
      .populate("assignedOffice.officeId", "officeName regionId")
      .populate("approvedBy", "name email");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(401).json({
        message: "Your account is not active. Please contact administrator.",
      });
    }

    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    // Optional: Set cookie for local development (won't work cross-domain HTTP/HTTPS)
    // Token in response body is the primary authentication method
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        extraPermissions: user.extraPermissions,
        teamName: user.teamName,
        assignedOffice: user.assignedOffice,
        approvedBy: user.approvedBy,
        signedUpOn: user.signedUpOn,
        approvedOn: user.approvedOn,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .populate("teamName.teamId", "teamName teamPermissions")
      .populate("assignedOffice.officeId", "officeName regionId")
      .populate("approvedBy", "name email");

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("teamName.teamId", "teamName teamPermissions")
      .populate("assignedOffice.officeId", "officeName regionId")
      .populate("approvedBy", "name email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isActive) {
      return res.status(400).json({ message: "User is already active" });
    }

    user.isActive = true;
    user.approvedBy = req.user._id;

    if (!user.approvedOn) {
      user.approvedOn = toCSTDateString();
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .populate("teamName.teamId", "teamName teamPermissions")
      .populate("assignedOffice.officeId", "officeName regionId")
      .populate("approvedBy", "name email");

    res.status(200).json({
      success: true,
      message: "User activated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: "User is already inactive" });
    }

    user.isActive = false;
    await user.save();

    const updatedUser = await User.findById(user._id)
      .populate("teamName.teamId", "teamName teamPermissions")
      .populate("assignedOffice.officeId", "officeName regionId")
      .populate("approvedBy", "name email");

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: "Please provide role" });
    }

    const validRoles = ["superAdmin", "admin", "user", "office"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    const updatedUser = await User.findById(user._id)
      .populate("teamName.teamId", "teamName teamPermissions")
      .populate("assignedOffice.officeId", "officeName regionId")
      .populate("approvedBy", "name email");

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateExtraPermissions = async (req, res) => {
  try {
    const { extraPermissions } = req.body;

    if (!extraPermissions) {
      return res
        .status(400)
        .json({ message: "Please provide extra permissions" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.extraPermissions = extraPermissions;
    await user.save();

    const updatedUser = await User.findById(user._id)
      .populate("teamName.teamId", "teamName teamPermissions")
      .populate("assignedOffice.officeId", "officeName regionId")
      .populate("approvedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Extra permissions updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const {
      password,
      role,
      extraPermissions,
      isActive,
      assignedOffice,
      teamName,
      ...updateData
    } = req.body;

    // Update simple fields
    Object.keys(updateData).forEach((key) => {
      user[key] = updateData[key];
    });

    // Handle assignedOffice - completely replace the array
    if (assignedOffice !== undefined) {
      if (Array.isArray(assignedOffice)) {
        // Check if it's array of objects or array of IDs
        user.assignedOffice = assignedOffice.map((item) => {
          // If item is already an object with officeId, keep it
          if (typeof item === "object" && item.officeId) {
            return { officeId: item.officeId };
          }
          // If item is just an ID string, convert to object
          return { officeId: item };
        });
      } else {
        user.assignedOffice = [];
      }
    }

    // Handle teamName - completely replace the array
    if (teamName !== undefined) {
      if (Array.isArray(teamName)) {
        // Check if it's array of objects or array of IDs
        user.teamName = teamName.map((item) => {
          // If item is already an object with teamId, keep it
          if (typeof item === "object" && item.teamId) {
            return { teamId: item.teamId };
          }
          // If item is just an ID string, convert to object
          return { teamId: item };
        });
      } else {
        user.teamName = [];
      }
    }

    await user.save();

    const updatedUser = await User.findById(req.params.id)
      .populate("teamName.teamId", "teamName teamPermissions")
      .populate("assignedOffice.officeId", "officeName regionId")
      .populate("approvedBy", "name email");

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (email) {
      const emailExists = await User.findOne({
        email,
        _id: { $ne: req.user._id },
      });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }
    if (password) user.password = password;

    await user.save();

    const updatedUser = await User.findById(user._id)
      .populate("teamName.teamId", "teamName teamPermissions")
      .populate("assignedOffice.officeId", "officeName regionId")
      .populate("approvedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  signup,
  login,
  getAllUsers,
  getUserById,
  activateUser,
  deactivateUser,
  changeUserRole,
  updateExtraPermissions,
  updateUser,
  updateProfile,
  deleteUser,
};
