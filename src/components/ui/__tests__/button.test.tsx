import {render, screen} from "@testing-library/react"

import {Button} from "../button"

describe("Button", () => {
    it("renders the provided children", () => {
        render(<Button>Submit</Button>)

        expect(screen.getByRole("button", {name: "Submit"})).toBeInTheDocument()
    })

    it("uses variant classes", () => {
        render(<Button variant="secondary">Save</Button>)

        expect(screen.getByRole("button", {name: "Save"})).toHaveClass(
            "bg-secondary"
        )
    })
})
