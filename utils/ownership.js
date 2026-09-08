const ApiError = require("./ApiError");

// Throws unless the pet belongs to the requesting user, or the user is an admin.
// Vets get read access when explicitly passed allowVet=true (used for medical routes).
function assertPetAccess(pet, user, { allowVet = false } = {}) {
  if (!pet) throw new ApiError(404, "Pet not found");
  const isOwner = pet.owner.toString() === user._id.toString();
  const isAdmin = user.role === "admin";
  const isVet = allowVet && user.role === "vet";
  if (!isOwner && !isAdmin && !isVet) {
    throw new ApiError(403, "You do not have access to this pet's records");
  }
}

module.exports = { assertPetAccess };
