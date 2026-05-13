const prisma = require("../lib/prisma");

const generateOrderCode = () => {
  return "SNK-" + Date.now().toString().slice(-6);
};

const createOrder = async (req, res) => {
  try {
    const { customerName, phone, address, items, paymentMethod } = req.body;

    if (!customerName || !phone || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Customer name, phone and items are required",
      });
    }

    for (const item of items) {
      if (!item.menuItemId || !item.quantity || Number(item.quantity) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Each item must have a valid menuItemId and quantity",
        });
      }
    }

    const menuItemIds = [...new Set(items.map((item) => item.menuItemId))];

    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: {
          in: menuItemIds,
        },
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more menu items were not found",
      });
    }

    let totalAmount = 0;

    const orderItemsData = items.map((item) => {
      const menuItem = menuItems.find(
        (menuItem) => menuItem.id === item.menuItemId
      );

      if (!menuItem) {
        throw new Error("Menu item not found");
      }

      if (!menuItem.isAvailable) {
        throw new Error(`${menuItem.name} is currently unavailable`);
      }

      const quantity = Number(item.quantity);
      const price = Number(menuItem.price);

      totalAmount += price * quantity;

      return {
        menuItemId: item.menuItemId,
        quantity,
        price,
      };
    });

    const customer = await prisma.customer.create({
      data: {
        name: customerName,
        phone,
        address,
      },
    });

    const order = await prisma.order.create({
      data: {
        orderCode: generateOrderCode(),
        customerId: customer.id,
        totalAmount,
        items: {
          create: orderItemsData,
        },
        payment: {
          create: {
            method: paymentMethod || "CASH",
            amount: totalAmount,
          },
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            menuItem: true,
          },
        },
        payment: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Order creation failed",
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        items: {
          include: {
            menuItem: true,
          },
        },
        payment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

const trackOrder = async (req, res) => {
  try {
    const { orderCode } = req.params;

    const order = await prisma.order.findUnique({
      where: {
        orderCode,
      },
      include: {
        customer: true,
        items: {
          include: {
            menuItem: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Order tracking failed",
      error: error.message,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Order status update failed",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  trackOrder,
  updateOrderStatus,
};