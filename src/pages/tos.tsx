// pages/TermsOfService.tsx

import type { NextPage } from 'next';
import {
  Container,
  Box,
  Typography,
  Link,
  List,
  ListItem,
  SxProps,
  Theme,
} from '@mui/material';

// Define styles based on the CSS
const bodyStyles: SxProps<Theme> = {
  background: 'transparent',
  fontFamily: 'Arial',
  color: '#595959', // Default body text color
  fontSize: '14px', // Default body text size
};

const logoStyles: SxProps<Theme> = {
  display: 'block',
  margin: '0 auto 3.125rem',
  width: '11.125rem',
  height: '2.375rem',
  // This is the Base64 SVG from your original HTML
  background:
    'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNzgiIGhlaWdodD0iMzgiIHZpZXdCb3g9IjAgMCAxNzggMzgiPgogICAgPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8cGF0aCBmaWxsPSIjRDFEMUQxIiBkPSJNNC4yODMgMjQuMTA3Yy0uNzA1IDAtMS4yNTgtLjI1Ni0xLjY2LS43NjhoLS4wODVjLjA1Ny41MDIuMDg2Ljc5Mi4wODYuODd2Mi40MzRILjk4NXYtOC42NDhoMS4zMzJsLjIzMS43NzloLjA3NmMuMzgzLS41OTQuOTUtLjg5MiAxLjcwMi0uODkyLjcxIDAgMS4yNjQuMjc0IDEuNjY1LjgyMi40MDEuNTQ4LjYwMiAxLjMwOS42MDIgMi4yODMgMCAuNjQtLjA5NCAxLjE5OC0uMjgyIDEuNjctLjE4OC40NzMtLjQ1Ni44MzMtLjgwMyAxLjA4LS4zNDcuMjQ3LS43NTYuMzctMS4yMjUuMzd6TTMuOCAxOS4xOTNjLS40MDUgMC0uNy4xMjQtLjg4Ni4zNzMtLjE4Ny4yNDktLjI4My42Ni0uMjkgMS4yMzN2LjE3N2MwIC42NDUuMDk1IDEuMTA3LjI4NyAxLjM4Ni4xOTIuMjguNDk1LjQxOS45MS40MTkuNzM0IDAgMS4xMDEtLjYwNSAxLjEwMS0xLjgxNiAwLS41OS0uMDktMS4wMzQtLjI3LTEuMzI5LS4xODItLjI5NS0uNDY1LS40NDMtLjg1Mi0uNDQzem01LjU3IDEuNzk0YzAgLjU5NC4wOTggMS4wNDQuMjkzIDEuMzQ4LjE5Ni4zMDQuNTEzLjQ1Ny45NTQuNDU3LjQzNyAwIC43NS0uMTUyLjk0Mi0uNDU0LjE5Mi0uMzAzLjI4OC0uNzUzLjI4OC0xLjM1MSAwLS41OTUtLjA5Ny0xLjA0LS4yOS0xLjMzOC0uMTk0LS4yOTctLjUxLS40NDUtLjk1LS40NDUtLjQzOCAwLS43NTMuMTQ3LS45NDYuNDQzLS4xOTQuMjk1LS4yOS43NDItLjI5IDEuMzR6bTQuMTUzIDBjMCAuOTc3LS4yNTggMS43NDItLjc3NCAyLjI5My0uNTE1LjU1Mi0xLjIzMy44MjctMi4xNTQuODI3LS41NzYgMC0xLjA4NS0uMTI2LTEuNTI1LS4zNzhhMi41MiAyLTIgMCAwIDEtMS4wMTUtMS4wODhjLS4yMzctLjQ3My0uMzU1LTEuMDI0LS4zNTUtMS42NTQgMC0uOTgxLjI1Ni0xLjc0NC43NjgtMi4yODguNTEyLS41NDUgMS4yMzItLjgxNyAyLjE2LS44MTcuNTc2IDAgMS4wODUuMTI2IDEuNTI1LjM3Ni40NC4yNTEuNzc5LjYxIDEuMDE1IDEuMDguMjM2LjQ2OS4zNTUgMS4wMTkuMzU1IDEuNjQ5ek0xOS43MSAyNGwtLjQ2Mi0yLjEtLjYyMy0yLjY1M2gtLjAzN0wxNy40OTMgMjRIMTUuNzNsLTEuNzA4LTYuMDA1aDEuNjMzbC42OTMgMi42NTljLjExLjQ3Ni4yMjQgMS4xMzMuMzM4IDEuOTcxaC4wMzJjLjAxNS0uMjcyLjA3Ny0uNzA0LjE4OC0xLjI5NGwuMDg2LS40NTcuNzQyLTIuODc5aDEuODA0bC43MDQgMi44NzljLjAxNC4wNzkuMDM3LjE5NS4wNjcuMzVhMjAuOTk4IDIwLjk5OCAwIDAgMSAuMTY3IDEuMDAyYy4wMjMuMTY1LjAzNi4yOTkuMDQuMzk5aC4wMzJjLjAzMi0uMjU4LjA5LS42MTEuMTcyLTEuMDYuMDgyLS40NS4xNDEtLjc1NC4xNzctLjkxMWwuNzItMi42NTloMS42MDZMMjEuNDk0IDI0aC0xLjc4M3ptNy4wODYtNC45NTJjLS4zNDggMC0uNjIuMTEtLjgxNy4zMy0uMTk3LjIyLS4zMS41MzMtLjMzOC45Mzdodi4yOTljLS4wMDgtLjQwNC0uMTEzLS43MTctLjMxNy0uOTM3LS4yMDQtLjIyLS40OC0uMzMtLjgyNy0uMzN6bS4yMyA1LjA2Yy0uOTY2IDAtMS43MjItLjI2Ny0yLjI2Ni0uOC0uNTQ0LS41MzQtLjgxNi0xLjI5LS44MTYtMi4yNjcgMC0xLjAwNy4yNTEtMS43ODUuNzU0LTIuMzM0LjUwMy0uNTUgMS4xOTktLjgyNSAyLjA4Ny0uODI1LjA0OCAwIDEuNTEuMjQyIDEuOTgyLjcyNS40NzIuNDg0LjcwOSAxLjE1Mi43MDkgMi4wMDR2Ljc5NWgtMy44NzNjLjAxOC40NjUuMTU2LjgyOS40MTQgMS4wOS4yNTguMjYxLjYyLjM5MiAxLjA4NS4zOTIuMzYxIDAgLjcwMy0uMDM3IDEuMDI2LS4xMTNhNS4xMzMgNS4xMzMgMCAwIDAgMS4wMS0uMzZ2MS4yNjhjLS4yODcuMTQzLS41OTMuMjUtLjkyLjMyYTUuNzkgNS43OSAwIDAgMS0xLjE5MS4xMDR6bTcuMjUzLTYuMjI2Yy4yMjIgMCAuNDA2LjAxNi41NTMuMDQ5bC0uMTI0IDEuNTM2YTEuODc3IDEuODc3IDAgMCAwLS40ODMtLjA1NGMtLjUyMyAwLS45My4xMzQtMS4yMjIuNDAzLS4yOTIuMjY4LS40MzguNjQ0LS40MzggMS4xMjhWMjRoLTEuNjM4di02LjAwNWgxLjI0bC4yNDIgMS4wMWguMDhjLjE4Ny0uMzM3LjQzOS0uNjA4Ljc1Ni0uODE0YTEuODYgMS44NiAwIDAgMSAxLjAzNC0uMzA5em00LjAyOSAxLjE2NmMtLjM0NyAwLS42Mi4xMS0uODE3LjMzLS4xOTcuMjItLjMxLjUzMy0uMzM4LjkzN2gyLjI5OWMtLjAwNy0uNDA0LS4xMTMtLjcxNy0uMzE3LS45MzctLjIwNC0uMjItLjQ4LS4zMy0uODI3LS4zM3ptLjIzIDUuMDZjLS45NjYgMC0xLjcyMi0uMjY3LTIuMjY2LTgtLjU0NC0uNTM0LS44MTYtMS4yOS0uODE2LTIuMjY3IDAtMS4wMDcuMjUxLTEuNzg1Ljc1NC0yLjMzNC41MDQtLjU1IDEuMi0uODI1IDIuMDg3LS44MjUuODQ5IDAgMS41MS4yNDIgMS45ODIuNzI1LjQ3My40ODQuNzA5IDEuMTUyLjcwOSAyLjAwNHYuNzk1aC0zLjg3M2MuMDE4LjQ2NS4xNTYuODI5LjQxNCAxLjA5LjI1OC4yNjEuNjIuMzkyIDEuMDg1LjM5Mi4zNjIgMCAuNzA0LS4wMzcgMS4wMjYtLjExM2E1LjEzMyA1LjEzMyAwIDAgMCAxLjAxLS4zNnYxLjI2OGMtLjI4Ny4xNDMtLjU5My4yNS0uOTE5LjMyYTUuNzkgNS43OSAwIDAgMS0xLjE5Mi4xMDR6bTUuODAzIDBjLS43MDYgMC0xLjI2LS4yNzUtMS42NjMtLjgyMi0uNDAzLS41NDgtLjYwNC0xLjMwNy0uNjA0LTIuMjc4IDAtLjk4NC4yMDUtMS43NTIuNjE1Mi4zMDEuNDEtLjU1Ljk3NS0uODI1IDEuNjk1LS44MjUuNzU1IDAgMS4zMzIuMjk0IDEuNzI5Ljg4MWguMDU0YTYuNjk3IDYuNjk3IDAgMCAxLS4xMjQtMS4xOTh2LTEuOTIyaDEuNjQ0VjI0SDQ2LjQzbC0uMzE3LS43NzloLS4wN2MtLjM3Mi41OTEtLjk0Ljg4Ni0xLjcwMi44ODZ6bS41NzQtMS4zMDZjLjQyIDAgLjcyNi0uMTIxLjkyMS0uMzY1LjE5Ni0uMjQzLjMwMi0uNjU3LjMyLTEuMjR2LS4xNzhjMC0uNjQ0LS4xLTEuMTA2LS4yOTgtMS4zODYtLjE5OS0uMjc5LS41MjItLjQxOS0uOTctLjQxOWEuOTYyLjk2MiAwIDAgMC0uODUuNDY1Yy0uMjAzLjMxLS4zMDQuNzYtLjMwNCAxLjM1IDAgLjU5Mi4xMDIgMS4wMzUuMzA2IDEuMzMuMjA0LjI5Ni40OTYuNDQzLjg3NS40NDN6bTEwLjkyMi00LjkyYy43MDkgMCAxLjI2NC4yNzcgMS42NjUuODMuNC41NTMuNjAxIDEuMzEyLjYwMSAyLjI3NSAwIC45OTItLjIwNiAxLjc2LS42MiAyLjMwNC0uNDE0LjU0NC0uOTc3LjgxNi0xLjY5LjgxNi0uNzA1IDAtMS4yNTgtLjI1Ni0xLjY1OS0uNzY4aC0uMTEzbC0uMjc0LjY2MWgtMS4yNTF2LTguMzU3aDEuNjM4djEuOTQ0YzAgLjI0Ny0uMDIxLjY0My0uMDY0IDEuMTg3aC4wNjRjLjM4My0uNTk0Ljk1LS44OTIgMS43MDMtLjg5MnptLS41MjcgMS4zMWMtLjQwNCAwLS43LjEyNS0uODg2LjM3NC0uMTg2LjI0OS0uMjgzLjY2LS4yOSAxLjIzM3YuMTc3YzAgLjY0NS4wOTYgMS4xMDcuMjg3IDEuMzg2LjE5Mi4yOC40OTUuNDE5LjkxLjQxOS4zMzcgMCAuNjA1LS4xNTUuODA0LS40NjUuMTk5LS4zMS4yOTgtLjc2LjI5OC0xLjM1IDAtLjU5MS0uMS0xLjAzNS0uMy0xLjMzYS45NDMuOTQzIDAgMCAwLS44MjMtLjQ0M3ptMy4xODYtMS4xOTdoMS43OTRsMS4xMzQgMy4zNzljLjA5Ni4yOTMuMTYzLjY0LjE5OCAxLjA0MmguMDMzYy4wMzktLjM3LjExNi0uNzE3LjIzLTEuMDQybDEuMTEyLTMuMzc5aDEuNzU3bC0yLjU0IDYuNzczYy0uMjM0LjYyNy0uNTY2IDEuMDk2LS45OTcgMS40MDctLjQzMi4zMTItLjkzNi40NjgtMS41MTIuNDY4LS4yODMgMC0uNTYtLjAzLS44MzMtLjA5MnYtMS4zYTIuOCAyLjggMCAwIDAgLjY0NS4wN2MuMjkgMCAuNTQzLS4wODguNzYtLjI2Ni4yMTctLjE3Ny4zODYtLjQ0NC41MDgtLjgwM2wuMDk2LS4yOTUtMi4xODUtNS45NjJ6Ii8+CiAgICAgICAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNzMpIj4KICAgICAgICAgICAgPGNpcmNsZSBjeD0iMTkiIGN5PSIxOSIgcj0iMTkiIGZpbGw9IiNFMEUwRTAiLz4KICAgICAgICAgICAgPHBhdGggZmlsbD0iI0ZGRiIgZD0iTTIyLjQ3NCAxNS40NDNoNS4xNjJMMTIuNDM2IDMwLjRWMTAuMzYzaDE1LjJsLTUuMTYyIDUuMDh6Ii8+CiAgICAgICAgPC9nPgogICAgICAgIDxwYXRoIGZpbGw9IiNEMkQyRDIiIGQ9Ik0xMjEuNTQ0IDE0LjU2di0xLjcyOGg4LjI3MnYxLjcyOGgtMy4wMjRWMjRoLTIuMjR2LTkuNDRoLTMuMDA4em0xMy43NDQgOS41NjhjLTEuMjkgMC0yLjM0MS0uNDE5LTMuMTUyLTEuMjU2LS44MS0uODM3LTEuMjE2LTEuOTQ0LTEuMjE2LTMuMzJzLjQwOC0yLjQ3NyAxLjIyNC0zLjMwNGMuODE2LS44MjcgMS44NzItMS4yNCAzLjE2OC0xLjI0czIuMzYuNDAzIDMuMTkyIDEuMjA4Yy44MzIuODA1IDEuMjQ4IDEuODggMS4yNDggMy4yMjQgMCAuMzEtLjAyMS41OTctLjA2NC44NjRoLTYuNDY0Yy4wNTMuNTc2LjI2NyAxLjA0LjY0IDEuMzkyLjM3My4zNTIuODQ4LjUyOCAxLjQyNC41MjguNzc5IDAgMS4zNTUtLjMyIDEuNzI4LS45NmgyLjQzMmEzLjg5MSAzLjg5MSAwIDAgMS0xLjQ4OCAyLjA2NGMtLjczNi41MzMtMS42MjcuOC0yLjY3Mi44em0xLjQ4LTYuNjg4Yy0uNC0uMzUyLS44ODMtLjUyOC0xLjQ0OC0uNTI4cy0xLjAzNy4xNzYtMS40MTYuNTI4Yy0uMzc5LjM1Mi0uNjA1LjgyMS0uNjggMS40MDhoNC4xOTJjLS4wMzItLjU4Ny0uMjQ4LTEuMDU2LS42NDgtMS40MDh6bTcuMDE2LTIuMzA0djEuNTY4Yy41OTctMS4xMyAxLjQ2MS0xLjY5NiAyLjU5Mi0xLjY5NnYyLjMwNGgtLjU2Yy0uNjcyIDAtMS4xNzkuMTY4LTEuNTIuNTA0LS4zNDEuMzM2LS41MTIuOTE1LS41MTIgMS43MzZWMjRoLTIuMjU2di04Ljg2NGgyLjI1NnptNi40NDggMHYxLjMyOGMuNTY1LS45NyAxLjQ4My0xLjQ1NiAyLjc1Mi0xLjQ1Ni42NzIgMCAxLjI3Mi4xNTUgMS44LjQ2NC41MjguMzEuOTM2Ljc1MiAxLjIyNCAxLjMyOC4zMS0uNTU1LjczMy0uOTkyIDEuMjcyLTEuMzEyYTMuNDg4IDMuNDg4IDAgMCAxIDEuODE2LS40OGMxLjA1NiAwIDEuOTA3LjMzIDIuNTUyLjk5Mi42NDUuNjYxLjk2OCAxLjU5Ljk2OCAyLjc4NFYyNGgtMi4yNHYtNC44OTZjMC0uNjkzLS4xNzYtMS4yMjQtLjUyOC0xLjU5Mi0uMzUyLS4zNjgtLjMyLS41NTItMS40NC0uNTUyc3MtMS4wOS4xODQtMS40NDguNTUyYy0uMzU3LjM2OC0uNTM2Ljg5OS0uNTM2IDEuNTkyVjI0aC0yLjI0di00Ljg5NmMwLS42OTMtLjE3Ni0xLjIyNC0uNTI4LTEuNTkyLS4zNTItLjM2OC0uODMyLS41NTItMS40NC0uNTUyc3MtMS4wOS4xODQtMS40NDguNTUyYy0uMzU3LjM2OC0uNTM2Ljg5OS0uNTM2IDEuNTkyVjI0aC0yLjI1NXYtOC44NjRoMi4yNTZ6TTE2NC45MzYgMjRWMTIuMTZoMi4yNTZWMjRoLTIuMjU2em03LjA0LS4xNmwtMy40NzItOC43MDRoMi41MjhsMi4yNTYgNi4zMDQgMi4zODQtNi4zMDRoMi4zNTJsLTUuNTM2IDEzLjA1NmgtMi4zNTJsMS44NC00LjM1MnoiLz4KICAgIDwvZz4KPC9zdmc+Cg==) center no-repeat',
};

const titleStyles: SxProps<Theme> = {
  fontFamily: 'Arial',
  fontSize: '26px',
  color: '#000000',
  fontWeight: 'bold', // from <strong>
  lineHeight: 1.5,
};

const subtitleStyles: SxProps<Theme> = {
  fontFamily: 'Arial',
  color: '#595959',
  fontSize: '14px',
  fontWeight: 'bold', // from <strong>
  lineHeight: 1.5,
};

const h1Styles: SxProps<Theme> = {
  fontFamily: 'Arial',
  fontSize: '19px',
  color: '#000000',
  fontWeight: 'bold', // from <strong>
  lineHeight: 1.5,
  mt: 2.5, // Replicating <br> spacing
  mb: 1.5,
};

const h2Styles: SxProps<Theme> = {
  fontFamily: 'Arial',
  fontSize: '17px',
  color: '#000000',
  fontWeight: 'bold', // from <strong>
  lineHeight: 1.5,
  mt: 1.5,
  mb: 1,
};

const bodyTextStyles: SxProps<Theme> = {
  color: '#595959',
  fontSize: '14px',
  fontFamily: 'Arial',
  lineHeight: 1.5,
};

const linkStyles: SxProps<Theme> = {
  color: '#3030F1',
  fontSize: '14px',
  fontFamily: 'Arial',
  wordBreak: 'break-word',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
};

// Styles for <ul>
const listStyles: SxProps<Theme> = {
  ...bodyTextStyles,
  listStyleType: 'square',
  pl: 4, // Replicates browser default indentation
  '& .MuiListItem-root': {
    display: 'list-item',
    padding: 0,
    pb: 0.5, // Small spacing between list items
  },
};

// Styles for <ol> (used in ToC)
const tocListStyles: SxProps<Theme> = {
  ...bodyTextStyles,
  listStyleType: 'decimal',
  pl: 4,
  '& .MuiListItem-root': {
    display: 'list-item',
    padding: 0,
    pb: 0.5,
  },
};

const TermsOfService: NextPage = () => {
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Box sx={bodyStyles}>
        <Box sx={logoStyles} />

        <Box sx={{ textAlign: 'left' }}>
          <Typography component="h1" sx={titleStyles}>
            TERMS OF SERVICE
          </Typography>
          <Typography component="div" sx={subtitleStyles}>
            Last updated October 19, 2025
          </Typography>

          <Box my={3} /> {/* Spacer */}

          <Typography component="h2" sx={h1Styles} id="agreement">
            AGREEMENT TO OUR LEGAL TERMS
          </Typography>

          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            We are <strong>compliancekit</strong> (
            <strong>&quot;Company,&quot;</strong>{' '}
            <strong>&quot;we,&quot;</strong> <strong>&quot;us,&quot;</strong>{' '}
            <strong>&quot;our&quot;</strong>), a company registered in{' '}
            <strong>California</strong>, <strong>United States</strong> at{' '}
            <strong>26 kristy ct</strong>, <strong>novato</strong>,{' '}
            <strong>CA</strong> <strong>94947</strong>.
          </Typography>

          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            We operate the website{' '}
            <Link href="https://compliancekit.app" sx={linkStyles}>
              compliancekit.app
            </Link>{' '}
            (the <strong>&quot;Site&quot;</strong>), as well as any other related
            products and services that refer or link to these legal terms (the{' '}
            <strong>&quot;Legal Terms&quot;</strong>) (collectively, the{' '}
            <strong>&quot;Services&quot;</strong>).
          </Typography>

          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            You can contact us by email at{' '}
            <Link href="mailto:support@compliancekit.app" sx={linkStyles}>
              support@compliancekit.app
            </Link>{' '}
            or by mail to <strong>26 kristy ct</strong>, <strong>novato</strong>,{' '}
            <strong>CA</strong> <strong>94947</strong>,{' '}
            <strong>United States</strong>.
          </Typography>

          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            These Legal Terms constitute a legally binding agreement made between
            you, whether personally or on behalf of an entity (
            <strong>&quot;you&quot;</strong>), and{' '}
            <strong>compliancekit</strong>, concerning your access to and use of
            the Services. You agree that by accessing the Services, you have
            read, understood, and agreed to be bound by all of these Legal Terms.
            IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE
            EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE
            USE IMMEDIATELY.
          </Typography>

          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            Supplemental terms and conditions or documents that may be posted on
            the Services from time to time are hereby expressly incorporated
            herein by reference. We reserve the right, in our sole discretion, to
            make changes or modifications to these Legal Terms at any time and
            for any reason. We will alert you about any changes by updating the
            &quot;Last updated&quot; date of these Legal Terms, and you waive
            any right to receive specific notice of each such change. It is your
            responsibility to periodically review these Legal Terms to stay
            informed of updates. You will be subject to, and will be deemed to
            have been made aware of and to have accepted, the changes in any
            revised Legal Terms by your continued use of the Services after the
            date such revised Legal Terms are posted.
          </Typography>

          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            All users who are minors in the jurisdiction in which they reside
            (generally under the age of 18) must have the permission of, and be
            directly supervised by, their parent or guardian to use the Services.
            If you are a minor, you must have your parent or guardian read and
            agree to these Legal Terms prior to you using the Services.
          </Typography>

          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            We recommend that you print a copy of these Legal Terms for your
            records.
          </Typography>

          <Typography component="h2" sx={h1Styles}>
            TABLE OF CONTENTS
          </Typography>
          <Box component="nav" sx={bodyTextStyles}>
            <List sx={tocListStyles}>
              <ListItem>
                <Link href="#services" sx={linkStyles}>
                  1. OUR SERVICES
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#ip" sx={linkStyles}>
                  2. INTELLECTUAL PROPERTY RIGHTS
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#userreps" sx={linkStyles}>
                  3. USER REPRESENTATIONS
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#userreg" sx={linkStyles}>
                  4. USER REGISTRATION
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#purchases" sx={linkStyles}>
                  5. PURCHASES AND PAYMENT
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#subscriptions" sx={linkStyles}>
                  6. SUBSCRIPTIONS
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#prohibited" sx={linkStyles}>
                  7. PROHIBITED ACTIVITIES
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#ugc" sx={linkStyles}>
                  8. USER GENERATED CONTRIBUTIONS
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#license" sx={linkStyles}>
                  9. CONTRIBUTION LICENSE
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#sitemanage" sx={linkStyles}>
                  10. SERVICES MANAGEMENT
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#ppyes" sx={linkStyles}>
                  11. PRIVACY POLICY
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#terms" sx={linkStyles}>
                  12. TERM AND TERMINATION
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#modifications" sx={linkStyles}>
                  13. MODIFICATIONS AND INTERRUPTIONS
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#law" sx={linkStyles}>
                  14. GOVERNING LAW
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#disputes" sx={linkStyles}>
                  15. DISPUTE RESOLUTION
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#corrections" sx={linkStyles}>
                  16. CORRECTIONS
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#disclaimer" sx={linkStyles}>
                  17. DISCLAIMER
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#liability" sx={linkStyles}>
                  18. LIMITATIONS OF LIABILITY
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#indemnification" sx={linkStyles}>
                  19. INDEMNIFICATION
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#userdata" sx={linkStyles}>
                  20. USER DATA
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#electronic" sx={linkStyles}>
                  21. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#california" sx={linkStyles}>
                  22. CALIFORNIA USERS AND RESIDENTS
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#misc" sx={linkStyles}>
                  23. MISCELLANEOUS
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#contact" sx={linkStyles}>
                  24. CONTACT US
                </Link>
              </ListItem>
            </List>
          </Box>

          {/* Section 1 */}
          <Typography component="h2" sx={h1Styles} id="services">
            1. OUR SERVICES
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            The information provided when using the Services is not intended for
            distribution to or use by any person or entity in any jurisdiction
            or country where such distribution or use would be contrary to law
            or regulation or which would subject us to any registration
            requirement within such jurisdiction or country. Accordingly, those
            persons who choose to access the Services from other locations do so
            on their own initiative and are solely responsible for compliance
            with local laws, if and to the extent local laws are applicable.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            The Services are not tailored to comply with industry-specific
            regulations (Health Insurance Portability and Accountability Act
            (HIPAA), Federal Information Security Management Act (FISMA), etc.),
            so if your interactions would be subjected to such laws, you may not
            use the Services. You may not use the Services in a way that would
            violate the Gramm-Leach-Bliley Act (GLBA).
          </Typography>

          {/* Section 2 */}
          <Typography component="h2" sx={h1Styles} id="ip">
            2. INTELLECTUAL PROPERTY RIGHTS
          </Typography>
          <Typography component="h3" sx={h2Styles}>
            Our intellectual property
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            We are the owner or the licensee of all intellectual property rights
            in our Services, including all source code, databases,
            functionality, software, website designs, audio, video, text,
            photographs, and graphics in the Services (collectively, the
            &quot;Content&quot;), as well as the trademarks, service marks, and
            logos contained therein (the &quot;Marks&quot;).
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            Our Content and Marks are protected by copyright and trademark laws
            (and various other intellectual property rights and unfair
            competition laws) and treaties in the United States and around the
            world.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            The Content and Marks are provided in or through the Services &quot;AS
            IS&quot; for your internal business purpose only.
          </Typography>

          <Typography component="h3" sx={h2Styles}>
            Your use of our Services
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            Subject to your compliance with these Legal Terms, including the
            &quot;
            <Link href="#prohibited" sx={linkStyles}>
              PROHIBITED ACTIVITIES
            </Link>
            &quot; section below, we grant you a non-exclusive,
            non-transferable, revocable license to:
          </Typography>
          <List sx={listStyles}>
            <ListItem>access the Services; and</ListItem>
            <ListItem>
              download or print a copy of any portion of the Content to which
              you have properly gained access,
            </ListItem>
          </List>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            solely for your internal business purpose.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            Except as set out in this section or elsewhere in our Legal Terms,
            no part of the Services and no Content or Marks may be copied,
            reproduced, aggregated, republished, uploaded, posted, publicly
            displayed, encoded, translated, transmitted, distributed, sold,
            licensed, or otherwise exploited for any commercial purpose
            whatsoever, without our express prior written permission.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            If you wish to make any use of the Services, Content, or Marks
            other than as set out in this section or elsewhere in our Legal
            Terms, please address your request to:{' '}
            <Link href="mailto:support@compliancekit.app" sx={linkStyles}>
              support@compliancekit.app
            </Link>
            . If we ever grant you the permission to post, reproduce, or
            publicly display any part of our Services or Content, you must
            identify us as the owners or licensors of the Services, Content, or
            Marks and ensure that any copyright or proprietary notice appears or
            is visible on posting, reproducing, or displaying our Content.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            We reserve all rights not expressly granted to you in and to the
            Services, Content, and Marks.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            Any breach of these Intellectual Property Rights will constitute a
            material breach of our Legal Terms and your right to use our
            Services will terminate immediately.
          </Typography>

          <Typography component="h3" sx={h2Styles}>
            Your submissions and contributions
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            Please review this section and the &quot;
            <Link href="#prohibited" sx={linkStyles}>
              PROHIBITED ACTIVITIES
            </Link>
            &quot; section carefully prior to using our Services to understand
            the (a) rights you give us and (b) obligations you have when you
            post or upload any content through the Services.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            <strong>Submissions:</strong> By directly sending us any question,
            comment, suggestion, idea, feedback, or other information about the
            Services (&quot;Submissions&quot;), you agree to assign to us all
            intellectual property rights in such Submission. You agree that we
            shall own this Submission and be entitled to its unrestricted use
            and dissemination for any lawful purpose, commercial or otherwise,
            without acknowledgment or compensation to you.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            <strong>Contributions:</strong> The Services may invite you to chat,
            contribute to, or participate in blogs, message boards, online
            forums, and other functionality during which you may create, submit,
            post, display, transmit, publish, distribute, or broadcast content
            and materials to us or through the Services, including but not
            limited to text, writings, video, audio, photographs, music,
            graphics, comments, reviews, rating suggestions, personal
            information, or other material (&quot;Contributions&quot;). Any
            Submission that is publicly posted shall also be treated as a
            Contribution.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            You understand that Contributions may be viewable by other users of
            the Services.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            <strong>
              When you post Contributions, you grant us a license (including
              use of your name, trademarks, and logos):
            </strong>{' '}
            By posting any Contributions, you grant us an unrestricted,
            unlimited, irrevocable, perpetual, non-exclusive, transferable,
            royalty-free, fully-paid, worldwide right, and license to: use,
            copy, reproduce, distribute, sell, resell, publish, broadcast,
            retitle, store, publicly perform, publicly display, reformat,
            translate, excerpt (in whole or in part), and exploit your
            Contributions (including, without limitation, your image, name, and
            voice) for any purpose, commercial, advertising, or otherwise, to
            prepare derivative works of, or incorporate into other works, your
            Contributions, and to sublicense the licenses granted in this
            section. Our use and distribution may occur in any media formats
            and through any media channels.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            This license includes our use of your name, company name, and
            franchise name, as applicable, and any of the trademarks, service
            marks, trade names, logos, and personal and commercial images you
            provide.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            <strong>You are responsible for what you post or upload:</strong> By
            sending us Submissions and/or posting Contributions through any part
            of the Services or making Contributions accessible through the
            Services by linking your account through the Services to any of your
            social networking accounts, you:
          </Typography>
          <List sx={listStyles}>
            <ListItem>
              confirm that you have read and agree with our &quot;
              <Link href="#prohibited" sx={linkStyles}>
                PROHIBITED ACTIVITIES
              </Link>
              &quot; and will not post, send, publish, upload, or transmit
              through the Services any Submission nor post any Contribution
              that is illegal, harassing, hateful, harmful, defamatory,
              obscene, bullying, abusive, discriminatory, threatening to any
              person or group, sexually explicit, false, inaccurate, deceitful,
              or misleading;
            </ListItem>
            <ListItem>
              to the extent permissible by applicable law, waive any and all
              moral rights to any such Submission and/or Contribution;
            </ListItem>
            <ListItem>
              warrant that any such Submission and/or Contributions are
              original to you or that you have the necessary rights and
              licenses to submit such Submissions and/or Contributions and that
              you have full authority to grant us the above-mentioned rights in
              relation to your Submissions and/or Contributions; and
            </ListItem>
            <ListItem>
              warrant and represent that your Submissions and/or Contributions
              do not constitute confidential information.
            </ListItem>
          </List>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            You are solely responsible for your Submissions and/or
            Contributions and you expressly agree to reimburse us for any and
            all losses that we may suffer because of your breach of (a) this
            section, (b) any third party’s intellectual property rights, or (c)
            applicable law.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            <strong>We may remove or edit your Content:</strong> Although we
            have no obligation to monitor any Contributions, we shall have the
            right to remove or edit any Contributions at any time without
            notice if in our reasonable opinion we consider such Contributions
            harmful or in breach of these Legal Terms. If we remove or edit any
            such Contributions, we may also suspend or disable your account and
            report you to the authorities.
          </Typography>

          {/* Section 3 */}
          <Typography component="h2" sx={h1Styles} id="userreps">
            3. USER REPRESENTATIONS
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            By using the Services, you represent and warrant that: (1) all
            registration information you submit will be true, accurate,
            current, and complete; (2) you will maintain the accuracy of such
            information and promptly update such registration information as
            necessary; (3) you have the legal capacity and you agree to comply
            with these Legal Terms; (4) you are not a minor in the jurisdiction
            in which you reside, or if a minor, you have received parental
            permission to use the Services; (5) you will not access the
            Services through automated or non-human means, whether through a
            bot, script or otherwise; (6) you will not use the Services for any
            illegal or unauthorized purpose; and (7) your use of the Services
            will not violate any applicable law or regulation.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            If you provide any information that is untrue, inaccurate, not
            current, or incomplete, we have the right to suspend or terminate
            your account and refuse any and all current or future use of the
            Services (or any portion thereof).
          </Typography>

          {/* Section 4 */}
          <Typography component="h2" sx={h1Styles} id="userreg">
            4. USER REGISTRATION
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            You may be required to register to use the Services. You agree to
            keep your password confidential and will be responsible for all use
            of your account and password. We reserve the right to remove,
            reclaim, or change a username you select if we determine, in our
            sole discretion, that such username is inappropriate, obscene, or
            otherwise objectionable.
          </Typography>

          {/* Section 5 */}
          <Typography component="h2" sx={h1Styles} id="purchases">
            5. PURCHASES AND PAYMENT
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            We accept the following forms of payment:
          </Typography>
          <List sx={{ ...listStyles, listStyleType: 'none', pl: 2 }}>
            <ListItem>
              -&nbsp;&nbsp;<strong>PayPal</strong>
            </ListItem>
            <ListItem>
              -&nbsp;&nbsp;<strong>Discover</strong>
            </ListItem>
            <ListItem>
              -&nbsp;&nbsp;<strong>American Express</strong>
            </ListItem>
            <ListItem>
              -&nbsp;&nbsp;<strong>Mastercard</strong>
            </ListItem>
            <ListItem>
              -&nbsp;&nbsp;<strong>Visa</strong>
            </ListItem>
          </List>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            You agree to provide current, complete, and accurate purchase and
            account information for all purchases made via the Services. You
            further agree to promptly update account and payment information,
            including email address, payment method, and payment card
            expiration date, so that we can complete your transactions and
            contact you as needed. Sales tax will be added to the price of
            purchases as deemed required by us. We may change prices at any
            time. All payments shall be in <strong>US dollars</strong>.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            You agree to pay all charges at the prices then in effect for your
            purchases and any applicable shipping fees, and you authorize us
            to charge your chosen payment provider for any such amounts upon
            placing your order. We reserve the right to correct any errors or
            mistakes in pricing, even if we have already requested or received
            payment.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            We reserve the right to refuse any order placed through the
            Services. We may, in our sole discretion, limit or cancel
            quantities purchased per person, per household, or per order. These
            restrictions may include orders placed by or under the same
            customer account, the same payment method, and/or orders that use
            the same billing or shipping address. We reserve the right to limit
            or prohibit orders that, in our sole judgment, appear to be placed
            by dealers, resellers, or distributors.
          </Typography>

          {/* Section 6 */}
          <Typography component="h2" sx={h1Styles} id="subscriptions">
            6. SUBSCRIPTIONS
          </Typography>
          <Typography component="h3" sx={h2Styles}>
            Billing and Renewal
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            Your subscription will continue and automatically renew unless
            canceled. You consent to our charging your payment method on a
            recurring basis without requiring your prior approval for each
            recurring charge, until such time as you cancel the applicable
            order. The length of your billing cycle is monthly.
          </Typography>
          <Typography component="h3" sx={h2Styles}>
            Free Trial
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            We offer a <strong>7</strong>-day free trial to new users who
            register with the Services. <strong>The account will be charged
            according to the user&apos;s chosen subscription</strong> at the end of
            the free trial.
          </Typography>
          <Typography component="h3" sx={h2Styles}>
            Cancellation
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            You can cancel your subscription at any time by contacting us using
            the contact information provided below. Your cancellation will take
            effect at the end of the current paid term. If you have any
            questions or are unsatisfied with our Services, please email us at{' '}
            <Link href="mailto:support@compliancekit.app" sx={linkStyles}>
              support@compliancekit.app
            </Link>
            .
          </Typography>
          <Typography component="h3" sx={h2Styles}>
            Fee Changes
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            We may, from time to time, make changes to the subscription fee and
            will communicate any price changes to you in accordance with
            applicable law.
          </Typography>

          {/* Section 7 */}
          <Typography component="h2" sx={h1Styles} id="prohibited">
            7. PROHIBITED ACTIVITIES
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            You may not access or use the Services for any purpose other than
            that for which we make the Services available. The Services may not
            be used in connection with any commercial endeavors except those
            that are specifically endorsed or approved by us.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            As a user of the Services, you agree not to:
          </Typography>
          <List sx={listStyles}>
            <ListItem>
              Systematically retrieve data or other content from the Services
              to create or compile, directly or indirectly, a collection,
              compilation, database, or directory without written permission
              from us.
            </ListItem>
            <ListItem>
              Trick, defraud, or mislead us and other users, especially in any
              attempt to learn sensitive account information such as user
              passwords.
            </ListItem>
            <ListItem>
              Circumvent, disable, or otherwise interfere with security-related
              features of the Services, including features that prevent or
              restrict the use or copying of any Content or enforce limitations
              on the use of the Services and/or the Content contained therein.
            </ListItem>
            <ListItem>
              Disparage, tarnish, or otherwise harm, in our opinion, us and/or
              the Services.
            </ListItem>
            <ListItem>
              Use any information obtained from the Services in order to
              harass, abuse, or harm another person.
            </ListItem>
            <ListItem>
              Make improper use of our support services or submit false reports
              of abuse or misconduct.
            </ListItem>
            <ListItem>
              Use the Services in a manner inconsistent with any applicable
              laws or regulations.
            </ListItem>
            <ListItem>
              Engage in unauthorized framing of or linking to the Services.
            </ListItem>
            <ListItem>
              Upload or transmit (or attempt to upload or to transmit) viruses,
              Trojan horses, or other material, including excessive use of
              capital letters and spamming (continuous posting of repetitive
              text), that interferes with any party’s uninterrupted use and
              enjoyment of the Services or modifies, impairs, disrupts, alters,
              or interferes with the use, features, functions, operation, or
              maintenance of the Services.
            </ListItem>
            <ListItem>
              Engage in any automated use of the system, such as using scripts
              to send comments or messages, or using any data mining, robots,
              or similar data gathering and extraction tools.
            </ListItem>
            <ListItem>
              Delete the copyright or other proprietary rights notice from any
              Content.
            </ListItem>
            <ListItem>
              Attempt to impersonate another user or person or use the username
              of another user.
            </ListItem>
            <ListItem>
              Upload or transmit (or attempt to upload or to transmit) any
              material that acts as a passive or active information collection
              or transmission mechanism, including without limitation, clear
              graphics interchange formats (&quot;gifs&quot;), 1×1 pixels, web
              bugs, cookies, or other similar devices (sometimes referred to as
              &quot;spyware&quot; or &quot;passive collection
              mechanisms&quot; or &quot;pcms&quot;).
            </ListItem>
            <ListItem>
              Interfere with, disrupt, or create an undue burden on the
              Services or the networks or services connected to the Services.
            </ListItem>
            <ListItem>
              Harass, annoy, intimidate, or threaten any of our employees or
              agents engaged in providing any portion of the Services to you.
            </ListItem>
            <ListItem>
              Attempt to bypass any measures of the Services designed to
              prevent or restrict access to the Services, or any portion of the
              Services.
            </ListItem>
            <ListItem>
              Copy or adapt the Services&apos; software, including but not
              limited to Flash, PHP, HTML, JavaScript, or other code.
            </ListItem>
            <ListItem>
              Except as permitted by applicable law, decipher, decompile,
              disassemble, or reverse engineer any of the software comprising
              or in any way making up a part of the Services.
            </ListItem>
            <ListItem>
              Except as may be the result of standard search engine or Internet
              browser usage, use, launch, develop, or distribute any automated
              system, including without limitation, any spider, robot, cheat
              utility, scraper, or offline reader that accesses the Services,
              or use or launch any unauthorized script or other software.
            </ListItem>
            <ListItem>
              Use a buying agent or purchasing agent to make purchases on the
              Services.
            </ListItem>
            <ListItem>
              Make any unauthorized use of the Services, including collecting
              usernames and/or email addresses of users by electronic or other
              means for the purpose of sending unsolicited email, or creating
              user accounts by automated means or under false pretenses.
            </ListItem>
            <ListItem>
              Use the Services as part of any effort to compete with us or
              otherwise use the Services and/or the Content for any
              revenue-generating endeavor or commercial enterprise.
            </ListItem>
            <ListItem>
              Use the Services to advertise or offer to sell goods and
              services.
            </ListItem>
            <ListItem>Sell or otherwise transfer your profile.</ListItem>
          </List>

          {/* Section 8 */}
          <Typography component="h2" sx={h1Styles} id="ugc">
            8. USER GENERATED CONTRIBUTIONS
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            The Services may invite you to chat, contribute to, or participate
            in blogs, message boards, online forums, and other functionality,
            and may provide you with the opportunity to create, submit, post,
            display, transmit, perform, publish, distribute, or broadcast
            content and materials to us or on the Services, including but not
            limited to text, writings, video, audio, photographs, graphics,
            comments, suggestions, or personal information or other material
            (collectively, &quot;Contributions&quot;). Contributions may be
            viewable by other users of the Services and through third-party
            websites. As such, any Contributions you transmit may be treated as
            non-confidential and non-proprietary. When you create or make
            available any Contributions, you thereby represent and warrant
            that:
          </Typography>
          <List sx={listStyles}>
            <ListItem>
              The creation, distribution, transmission, public display, or
              performance, and the accessing, downloading, or copying of your
              Contributions do not and will not infringe the proprietary
              rights, including but not limited to the copyright, patent,
              trademark, trade secret, or moral rights of any third party.
            </ListItem>
            <ListItem>
              You are the creator and owner of or have the necessary licenses,
              rights, consents, releases, and permissions to use and to
              authorize us, the Services, and other users of the Services to
              use your Contributions in any manner contemplated by the Services
              and these Legal Terms.
            </ListItem>
            <ListItem>
              You have the written consent, release, and/or permission of each
              and every identifiable individual person in your Contributions to
              use the name or likeness of each and every such identifiable
              individual person to enable inclusion and use of your
              Contributions in any manner contemplated by the Services and
              these Legal Terms.
            </ListItem>
            <ListItem>
              Your Contributions are not false, inaccurate, or misleading.
            </ListItem>
            <ListItem>
              Your Contributions are not unsolicited or unauthorized
              advertising, promotional materials, pyramid schemes, chain
              letters, spam, mass mailings, or other forms of solicitation.
            </ListItem>
            <ListItem>
              Your Contributions are not obscene, lewd, lascivious, filthy,
              violent, harassing, libelous, slanderous, or otherwise
              objectionable (as determined by us).
            </ListItem>
            <ListItem>
              Your Contributions do not ridicule, mock, disparage, intimidate,
              or abuse anyone.
            </ListItem>
            <ListItem>
              Your Contributions are not used to harass or threaten (in the
              legal sense of those terms) any other person and to promote
              violence against a specific person or class of people.
            </ListItem>
            <ListItem>
              Your Contributions do not violate any applicable law, regulation,
              or rule.
            </ListItem>
            <ListItem>
              Your Contributions do not violate the privacy or publicity rights
              of any third party.
            </ListItem>
            <ListItem>
              Your Contributions do not violate any applicable law concerning
              child pornography, or otherwise intended to protect the health or
              well-being of minors.
            </ListItem>
            <ListItem>
              Your Contributions do not include any offensive comments that are
              connected to race, national origin, gender, sexual preference,
              or physical handicap.
            </ListItem>
            <ListItem>
              Your Contributions do not otherwise violate, or link to material
              that violates, any provision of these Legal Terms, or any
              applicable law or regulation.
            </ListItem>
          </List>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            Any use of the Services in violation of the foregoing violates
            these Legal Terms and may result in, among other things,
            termination or suspension of your rights to use the Services.
          </Typography>

          {/* Section 9 */}
          <Typography component="h2" sx={h1Styles} id="license">
            9. CONTRIBUTION LICENSE
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            By posting your Contributions to any part of the Services, you
            automatically grant, and you represent and warrant that you have
            the right to grant, to us an unrestricted, unlimited, irrevocable,
            perpetual, non-exclusive, transferable, royalty-free, fully-paid,
            worldwide right, and license to host, use, copy, reproduce,
            disclose, sell, resell, publish, broadcast, retitle, archive,
            store, cache, publicly perform, publicly display, reformat,
            translate, transmit, excerpt (in whole or in part), and distribute
            such Contributions (including, without limitation, your image and
            voice) for any purpose, commercial, advertising, or otherwise, and
            to prepare derivative works of, or incorporate into other works,
            such Contributions, and grant and authorize sublicenses of the
            foregoing. The use and distribution may occur in any media formats
            and through any media channels.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            This license will apply to any form, media, or technology now
            known or hereafter developed, and includes our use of your name,
            company name, and franchise name, as applicable, and any of the
            trademarks, service marks, trade names, logos, and personal and
            commercial images you provide. You waive all moral rights in your
            Contributions, and you warrant that moral rights have not otherwise
            been asserted in your Contributions.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            We do not assert any ownership over your Contributions. You retain
            full ownership of all of your Contributions and any intellectual
            property rights or other proprietary rights associated with your
            Contributions. We are not liable for any statements or
            representations in your Contributions provided by you in any area
            on the Services. You are solely responsible for your Contributions
            to the Services and you expressly agree to exonerate us from any
            and all responsibility and to refrain from any legal action against
            us regarding your Contributions.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            We have the right, in our sole and absolute discretion, (1) to
            edit, redact, or otherwise change any Contributions; (2) to
            re-categorize any Contributions to place them in more appropriate
            locations on the Services; and (3) to pre-screen or delete any
            Contributions at any time and for any reason, without notice. We
            have no obligation to monitor your Contributions.
          </Typography>

          {/* Section 10 */}
          <Typography component="h2" sx={h1Styles} id="sitemanage">
            10. SERVICES MANAGEMENT
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            We reserve the right, but not the obligation, to: (1) monitor the
            Services for violations of these Legal Terms; (2) take appropriate
            legal action against anyone who, in our sole discretion, violates
            the law or these Legal Terms, including without limitation,
            reporting such user to law enforcement authorities; (3) in our sole
            discretion and without limitation, refuse, restrict access to,
            limit the availability of, or disable (to the extent
            technologically feasible) any of your Contributions or any portion
            thereof; (4) in our sole discretion and without limitation, notice,
            or liability, to remove from the Services or otherwise disable all
            files and content that are excessive in size or are in any way
            burdensome to our systems; and (5) otherwise manage the Services in
            a manner designed to protect our rights and property and to
            facilitate the proper functioning of the Services.
          </Typography>

          {/* Section 11 */}
          <Typography component="h2" sx={h1Styles} id="ppyes">
            11. PRIVACY POLICY
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            We care about data privacy and security. Please review our Privacy
            Policy:{' '}
            <strong>
              <Link href="https://compliancekit.app/privacy" sx={linkStyles}>
                compliancekit.app/privacy
              </Link>
            </strong>
            . By using the Services, you agree to be bound by our Privacy
            Policy, which is incorporated into these Legal Terms. Please be
            advised the Services are hosted in <strong>the United States</strong>.
            If you access the Services from any other region of the world with
            laws or other requirements governing personal data collection, use,
            or disclosure that differ from applicable laws in{' '}
            <strong>the United States</strong>, then through your continued use
            of the Services, you are transferring your data to{' '}
            <strong>the United States</strong>, and you expressly consent to
            have your data transferred to and processed in{' '}
            <strong>the United States</strong>.
          </Typography>

          {/* Section 12 */}
          <Typography component="h2" sx={h1Styles} id="terms">
            12. TERM AND TERMINATION
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            These Legal Terms shall remain in full force and effect while you
            use the Services. WITHOUT LIMITING ANY OTHER PROVISION OF THESE
            LEGAL TERMS, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND
            WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SERVICES
            (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY
            REASON OR FOR NO REASON, INCLUDING WITHOUT LIMITATION FOR BREACH OF
            ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THESE LEGAL
TERMS OR OF ANY APPLICABLE LAW OR REGULATION. WE MAY TERMINATE YOUR
            USE OR PARTICIPATION IN THE SERVICES OR DELETE YOUR ACCOUNT AND ANY
            CONTENT OR INFORMATION THAT YOU POSTED AT ANY TIME, WITHOUT
            WARNING, IN OUR SOLE DISCRETION.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            If we terminate or suspend your account for any reason, you are
            prohibited from registering and creating a new account under your
            name, a fake or borrowed name, or the name of any third party, even
            if you may be acting on behalf of the third party. In addition to
            terminating or suspending your account, we reserve the right to
            take appropriate legal action, including without limitation
            pursuing civil, criminal, and injunctive redress.
          </Typography>

          {/* Section 13 */}
          <Typography component="h2" sx={h1Styles} id="modifications">
            13. MODIFICATIONS AND INTERRUPTIONS
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            We reserve the right to change, modify, or remove the contents of
            the Services at any time or for any reason at our sole discretion
            without notice. However, we have no obligation to update any
            information on our Services. We will not be liable to you or any
            third party for any modification, price change, suspension, or
            discontinuance of the Services.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            We cannot guarantee the Services will be available at all times. We
            may experience hardware, software, or other problems or need to
            perform maintenance related to the Services, resulting in
            interruptions, delays, or errors. We reserve the right to change,
            revise, update, suspend, discontinue, or otherwise modify the
            Services at any time or for any reason without notice to you. You
            agree that we have no liability whatsoever for any loss, damage, or
            inconvenience caused by your inability to access or use the
Services during any downtime or discontinuance of the Services.
            Nothing in these Legal Terms will be construed to obligate us to
            maintain and support the Services or to supply any corrections,
            updates, or releases in connection therewith.
          </Typography>

          {/* Section 14 */}
          <Typography component="h2" sx={h1Styles} id="law">
            14. GOVERNING LAW
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            These Legal Terms and your use of the Services are governed by and
            construed in accordance with the laws of{' '}
            <strong>the State of California</strong> applicable to agreements
            made and to be entirely performed within{' '}
            <strong>the State of California</strong>, without regard to its
            conflict of law principles.
          </Typography>

          {/* Section 15 */}
          <Typography component="h2" sx={h1Styles} id="disputes">
            15. DISPUTE RESOLUTION
          </Typography>
          <Typography component="h3" sx={h2Styles}>
            Informal Negotiations
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            To expedite resolution and control the cost of any dispute,
            controversy, or claim related to these Legal Terms (each a
            &quot;Dispute&quot; and collectively, the &quot;Disputes&quot;)
            brought by either you or us (individually, a &quot;Party&quot; and
            collectively, the &quot;Parties&quot;), the Parties agree to first
            attempt to negotiate any Dispute (except those Disputes expressly
            provided below) informally for at least{' '}
            <strong>thirty (30)</strong> days before initiating arbitration.
            Such informal negotiations commence upon written notice from one
            Party to the other Party.
          </Typography>
          <Typography component="h3" sx={h2Styles}>
            Binding Arbitration
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            If the Parties are unable to resolve a Dispute through informal
            negotiations, the Dispute (except those Disputes expressly
            excluded below) will be finally and exclusively resolved by binding
            arbitration. YOU UNDERSTAND THAT WITHOUT THIS PROVISION, YOU WOULD
            HAVE THE RIGHT TO SUE IN COURT AND HAVE A JURY TRIAL. The
            arbitration shall be commenced and conducted under the Commercial
            Arbitration Rules of the American Arbitration Association
            (&quot;AAA&quot;) and, where appropriate, the AAA’s Supplementary
            Procedures for Consumer Related Disputes (&quot;AAA Consumer
            Rules&quot;), both of which are available at the{' '}
            <Link
              href="http://www.adr.org"
              rel="noopener noreferrer"
              target="_blank"
              sx={linkStyles}
            >
              American Arbitration Association (AAA) website
            </Link>
            . Your arbitration fees and your share of arbitrator compensation
            shall be governed by the AAA Consumer Rules and, where appropriate,
            limited by the AAA Consumer Rules. The arbitration may be
            conducted in person, through the submission of documents, by phone,
            or online. The arbitrator will make a decision in writing, but need
            not provide a statement of reasons unless requested by either
            Party. The arbitrator must follow applicable law, and any award may
            be challenged if the arbitrator fails to do so. Except where
            otherwise required by the applicable AAA rules or applicable law,
            the arbitration will take place in <strong>Marin</strong>,{' '}
            <strong>California</strong>. Except as otherwise provided herein,
            the Parties may litigate in court to compel arbitration, stay
            proceedings pending arbitration, or to confirm, modify, vacate, or
            enter judgment on the award entered by the arbitrator.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            If for any reason, a Dispute proceeds in court rather than
            arbitration, the Dispute shall be commenced or prosecuted in the
            state and federal courts located in <strong>Marin</strong>,{' '}
            <strong>California</strong>, and the Parties hereby consent to, and
            waive all defenses of lack of personal jurisdiction, and forum non
            conveniens with respect to venue and jurisdiction in such state and
            federal courts. Application of the United Nations Convention on
            Contracts for the International Sale of Goods and the Uniform
Computer Information Transaction Act (UCITA) are excluded from these
            Legal Terms.
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            In no event shall any Dispute brought by either Party related in
            any way to the Services be commenced more than{' '}
            <strong>one (1)</strong> years after the cause of action arose. If
            this provision is found to be illegal or unenforceable, then
            neither Party will elect to arbitrate any Dispute falling within
            that portion of this provision found to be illegal or unenforceable
            and such Dispute shall be decided by a court of competent
            jurisdiction within the courts listed for jurisdiction above, and
            the Parties agree to submit to the personal jurisdiction of that
            court.
          </Typography>
          <Typography component="h3" sx={h2Styles}>
            Restrictions
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            The Parties agree that any arbitration shall be limited to the
            Dispute between the Parties individually. To the full extent
            permitted by law, (a) no arbitration shall be joined with any other
            proceeding; (b) there is no right or authority for any Dispute to
            be arbitrated on a class-action basis or to utilize class action
            procedures; and (c) there is no right or authority for any Dispute
            to be brought in a purported representative capacity on behalf of
            the general public or any other persons.
          </Typography>
          <Typography component="h3" sx={h2Styles}>
            Exceptions to Informal Negotiations and Arbitration
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            The Parties agree that the following Disputes are not subject to
            the above provisions concerning informal negotiations binding
            arbitration: (a) any Disputes seeking to enforce or protect, or
            concerning the validity of, any of the intellectual property rights
            of a Party; (b) any Dispute related to, or arising from,
            allegations of theft, piracy, invasion of privacy, or unauthorized
            use; and (c) any claim for injunctive relief. If this provision is
            found to be illegal or unenforceable, then neither Party will elect
            to arbitrate any Dispute falling within that portion of this
            provision found to be illegal or unenforceable and such Dispute
            shall be decided by a court of competent jurisdiction within the
            courts listed for jurisdiction above, and the Parties agree to
            submit to the personal jurisdiction of that court.
          </Typography>

          {/* Section 16 */}
          <Typography component="h2" sx={h1Styles} id="corrections">
            16. CORRECTIONS
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            There may be information on the Services that contains
            typographical errors, inaccuracies, or omissions, including
            descriptions, pricing, availability, and various other
            information. We reserve the right to correct any errors,
            inaccuracies, or omissions and to change or update the information
            on the Services at any time, without prior notice.
          </Typography>

          {/* Section 17 */}
          <Typography component="h2" sx={h1Styles} id="disclaimer">
            17. DISCLAIMER
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU
            AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK. TO
            THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES,
            EXPRESS OR IMPLIED, IN CONNECTION WITH THE SERVICES AND YOUR USE
            THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT
            THE ACCURACY OR COMPLETENESS OF THE SERVICES&apos; CONTENT OR THE
            CONTENT OF ANY WEBSITES OR MOBILE APPLICATIONS LINKED TO THE
            SERVICES AND WE WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR ANY
            (1) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS, (2)
            PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER,
            RESULTING FROM YOUR ACCESS TO AND USE OF THE SERVICES, (3) ANY
            UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND
            ALL PERSONAL INFORMATION AND/OR FINANCIAL INFORMATION STORED
            THEREIN, (4) ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR
            FROM THE SERVICES, (5) ANY BUGS, VIRUSES, TROJAN HORSES, OR THE
            LIKE WHICH MAY BE TRANSMITTED TO OR THROUGH THE SERVICES BY ANY
            THIRD PARTY, AND/OR (6) ANY ERRORS OR OMISSIONS IN ANY CONTENT AND
            MATERIALS OR FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A
            RESULT OF THE USE OF ANY CONTENT POSTED, TRANSMITTED, OR OTHERWISE
            MADE AVAILABLE VIA THE SERVICES. WE DO NOT WARRANT, ENDORSE,
            GUARANTEE, OR ASSUME RESPONSIBILITY FOR ANY PRODUCT OR SERVICE
            ADVERTISED OR OFFERED BY A THIRD PARTY THROUGH THE SERVICES, ANY
            HYPERLINKED WEBSITE, OR ANY WEBSITE OR MOBILE APPLICATION FEATURED
            IN ANY BANNER OR OTHER ADVERTISING, AND WE WILL NOT BE A PARTY TO
            OR IN ANY WAY BE RESPONSIBLE FOR MONITORING ANY TRANSACTION BETWEEN
            YOU AND ANY THIRD-PARTY PROVIDERS OF PRODUCTS OR SERVICES. AS WITH
            THE PURCHASE OF A PRODUCT OR SERVICE THROUGH ANY MEDIUM OR IN ANY
            ENVIRONMENT, YOU SHOULD USE YOUR BEST JUDGMENT AND EXERCISE CAUTION
            WHERE APPROPRIATE.
          </Typography>

          {/* Section 18 */}
          <Typography component="h2" sx={h1Styles} id="liability">
            18. LIMITATIONS OF LIABILITY
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE
            LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT,
            CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES,
            INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER
            DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN
            ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. NOTWITHSTANDING
            ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR LIABILITY TO YOU FOR
            ANY CAUSE WHATSOEVER AND REGARDLESS OF THE FORM OF THE ACTION, WILL
            AT ALL TIMES BE LIMITED TO THE LESSER OF THE AMOUNT PAID, IF ANY,
            BY YOU TO US OR <strong>$0.00 USD</strong>. CERTAIN US STATE LAWS AND
            INTERNATIONAL LAWS DO NOT ALLOW LIMITATIONS ON IMPLIED WARRANTIES
            OR THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES. IF THESE LAWS
            APPLY TO YOU, SOME OR ALL OF THE ABOVE DISCLAIMERS OR LIMITATIONS
            MAY NOT APPLY TO YOU, AND YOU MAY HAVE ADDITIONAL RIGHTS.
          </Typography>

          {/* Section 19 */}
          <Typography component="h2" sx={h1Styles} id="indemnification">
            19. INDEMNIFICATION
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            You agree to defend, indemnify, and hold us harmless, including
            our subsidiaries, affiliates, and all of our respective officers,
            agents, partners, and employees, from and against any loss,
            damage, liability, claim, or demand, including reasonable
            attorneys’ fees and expenses, made by any third party due to or
            arising out of: (1) your Contributions; (2) use of the Services;
            (3) breach of these Legal Terms; (4) any breach of your
            representations and warranties set forth in these Legal Terms; (5)
            your violation of the rights of a third party, including but not
            limited to intellectual property rights; or (6) any overt harmful
            act toward any other user of the Services with whom you connected
            via the Services. Notwithstanding the foregoing, we reserve the
            right, at your expense, to assume the exclusive defense and control
            of any matter for which you are required to indemnify us, and you
            agree to cooperate, at your expense, with our defense of such
            claims. We will use reasonable efforts to notify you of any such
            claim, action, or proceeding which is subject to this
            indemnification upon becoming aware of it.
          </Typography>

          {/* Section 20 */}
          <Typography component="h2" sx={h1Styles} id="userdata">
            20. USER DATA
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            We will maintain certain data that you transmit to the Services for
            the purpose of managing the performance of the Services, as well as
            data relating to your use of the Services. Although we perform
            regular routine backups of data, you are solely responsible for all
            data that you transmit or that relates to any activity you have
            undertaken using the Services. You agree that we shall have no
            liability to you for any loss or corruption of any such data, and
          you hereby waive any right of action against us arising from any
            such loss or corruption of such data.
          </Typography>

          {/* Section 21 */}
          <Typography component="h2" sx={h1Styles} id="electronic">
            21. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            Visiting the Services, sending us emails, and completing online
            forms constitute electronic communications. You consent to receive
            electronic communications, and you agree that all agreements,
            notices, disclosures, and other communications we provide to you
            electronically, via email and on the Services, satisfy any legal
            requirement that such communication be in writing. YOU HEREBY AGREE
            TO THE USE OF ELECTRONIC SIGNATURES, CONTRACTS, ORDERS, AND OTHER
            RECORDS, AND TO ELECTRONIC DELIVERY OF NOTICES, POLICIES, AND
            RECORDS OF TRANSACTIONS INITIATED OR COMPLETED BY US OR VIA THE
            SERVICES. You hereby waive any rights or requirements under any
            statutes, regulations, rules, ordinances, or other laws in any
            jurisdiction which require an original signature or delivery or
            retention of non-electronic records, or to payments or the granting
            of credits by any means other than electronic means.
          </Typography>

          {/* Section 22 */}
          <Typography component="h2" sx={h1Styles} id="california">
            22. CALIFORNIA USERS AND RESIDENTS
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            If any complaint with us is not satisfactorily resolved, you can
            contact the Complaint Assistance Unit of the Division of Consumer
            Services of the California Department of Consumer Affairs in
            writing at 1625 North Market Blvd., Suite N 112, Sacramento,
            California 95834 or by telephone at (800) 952-5210 or (916)
            445-1254.
          </Typography>

          {/* Section 23 */}
          <Typography component="h2" sx={h1Styles} id="misc">
            23. MISCELLANEOUS
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            These Legal Terms and any policies or operating rules posted by us
            on the Services or in respect to the Services constitute the entire
            agreement and understanding between you and us. Our failure to
            exercise or enforce any right or provision of these Legal Terms
            shall not operate as a waiver of such right or provision. These
            Legal Terms operate to the fullest extent permissible by law. We
            may assign any or all of our rights and obligations to others at
            any time. We shall not be responsible or liable for any loss,
            damage, delay, or failure to act caused by any cause beyond our
            reasonable control. If any provision or part of a provision of
            these Legal Terms is determined to be unlawful, void, or
            unenforceable, that provision or part of the provision is deemed
            severable from these Legal Terms and does not affect the validity
            and enforceability of any remaining provisions. There is no joint
            venture, partnership, employment or agency relationship created
            between you and us as a result of these Legal Terms or use of the
            Services. You agree that these Legal Terms will not be construed
            against us by virtue of having drafted them. You hereby waive any
            and all defenses you may have based on the electronic form of these
            Legal Terms and the lack of signing by the parties hereto to
            execute these Legal Terms.
          </Typography>

          {/* Section 24 */}
          <Typography component="h2" sx={h1Styles} id="contact">
            24. CONTACT US
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            In order to resolve a complaint regarding the Services or to
            receive further information regarding use of the Services, please
            contact us at:
          </Typography>
          <Typography variant="body1" sx={bodyTextStyles} gutterBottom>
            <strong>compliancekit</strong>
            <br />
            <strong>26 kristy ct</strong>
            <br />
            <strong>novato, CA 94947</strong>
            <br />
            <strong>United States</strong>
            <br />
            <Link href="mailto:support@compliancekit.app" sx={linkStyles}>
              <strong>support@compliancekit.app</strong>
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default TermsOfService;