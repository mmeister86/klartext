import { Text, TextProps } from "./Themed";

export function MonoText(props: TextProps) {
  return (
    <Text
      {...props}
      style={[
        { fontFamily: "Inter_500Medium", letterSpacing: 0.2 },
        props.style,
      ]}
    />
  );
}
