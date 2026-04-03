import Feather from "@expo/vector-icons/Feather";
import { cssInterop } from "nativewind";

cssInterop(Feather, {
  className: {
    target: "style",
    nativeStyleToProp: { color: true },
  },
});
