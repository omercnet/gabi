export const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
export const useRouter = () => router;
export const useLocalSearchParams = jest.fn(() => ({}));
export const Link = ({ children }: { children: React.ReactNode }) => children;
export const Slot = () => null;
export const Stack = () => null;
export const Redirect = () => null;
export { router as default };
