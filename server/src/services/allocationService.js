// Simplified allocation service
function buildSeatList(hall) {
const seats = [];
const rows = hall.rows || Math.ceil(hall.capacity / 10);
const cols = hall.cols || Math.ceil(hall.capacity / rows);
for (let r=1; r<=rows; r++){
for (let c=1; c<=cols; c++){
const label = `R${r}C${c}`;
seats.push({ label, r, c });
if (seats.length >= hall.capacity) break;
}
if (seats.length >= hall.capacity) break;
}
return seats;
}





function adjacentSeats(seat, seatsMap) {
// returns labels adjacent (up/down/left/right)
const adj = [];
const key = `${seat.r},${seat.c}`;
[[0,1],[0,-1],[1,0],[-1,0]].forEach(([dr,dc])=>{
const k = `${seat.r+dr},${seat.c+dc}`;
if (seatsMap[k]) adj.push(seatsMap[k]);
});
return adj;
}


function computePenalty(candidateSeat, placedNeighbors, student) {
// high penalty if neighbor same program
let p = 0;
for (const nb of placedNeighbors) {
if (!nb.student) continue;
if (nb.student.program === student.program) p += 1000; // avoid
if (nb.student.year === student.year) p += 10;
}
return p;
}


async function allocate({ halls, students, options = {} }){
// halls: [{..}] students: [{..}]
const allocations = {};
// prebuild seat lists and maps
for (const hall of halls){
const seats = buildSeatList(hall);
const seatsMap = {};
for (const s of seats) seatsMap[`${s.r},${s.c}`] = { ...s, student: null };
// convert to array for greedy assignment
const seatArray = Object.values(seatsMap);


// sort students: special first
const studentsSorted = [...students].sort((a,b)=> (b.specialNeeds?1:0) - (a.specialNeeds?1:0));


for (const student of studentsSorted){
// find best seat
let best = null; let bestP = Infinity;
for (const seat of seatArray){
if (seat.student) continue;
// if student needs accessible seat, prefer accessibleSeats if provided
if (student.specialNeeds && hall.accessibleSeats && hall.accessibleSeats.length>0){
if (!hall.accessibleSeats.includes(seat.label)) continue;
}
const neighbors = adjacentSeats(seat, seatsMap);
const p = computePenalty(seat, neighbors, student);
if (p < bestP) { bestP = p; best = seat }
}
if (best) best.student = student;
}


// create assignments list
allocations[hall._id || hall.name] = seatArray.filter(s=>s.student).map(s=>({ seat: s.label, student: s.student }));
}


return allocations;
}


module.exports = { allocate };