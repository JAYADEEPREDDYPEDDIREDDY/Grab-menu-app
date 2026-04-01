export default function MenuCard({ item }) {
  return (
    <div className="bg-[#161310] rounded-[20px] overflow-hidden border border-white/5 hover:shadow-lg transition">

      {/* IMAGE */}
      <div className="relative">
        <img
          src={item.image}
          className="w-full h-[190px] object-cover"
        />

        {/* VEG / NON VEG DOT */}
        <div
          className={`absolute top-3 left-3 w-4 h-4 rounded-full border-2 ${
            item.veg ? "border-green-500" : "border-red-500"
          }`}
        />

        {/* BADGE */}
        {item.badge && (
          <div className="absolute bottom-3 right-3 bg-orange-500 text-[10px] px-2 py-1 rounded">
            {item.badge}
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold">{item.name}</h3>
          <span className="text-orange-400 text-sm font-semibold">
            ₹{item.price}
          </span>
        </div>

        <p className="text-gray-400 text-xs mt-2 line-clamp-2">
          {item.desc}
        </p>

        <button className="mt-4 w-full bg-[#2A2623] py-2 rounded-full text-sm hover:bg-[#3a3430]">
          Add to Cart
        </button>
      </div>
    </div>
  );
}