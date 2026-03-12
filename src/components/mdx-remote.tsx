import { MDXRemote as MDXRemoteBase } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";

type Props = {
  source: string;
};

export function MDXRemote({ source }: Props) {
  return (
    <MDXRemoteBase
      source={source}
      options={{
        mdxOptions: {
          rehypePlugins: [
            [
              rehypePrettyCode,
              {
                theme: {
                  dark: "github-dark",
                  light: "github-light",
                },
                keepBackground: false,
              },
            ],
          ],
        },
      }}
    />
  );
}
